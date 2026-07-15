import { useState, useRef, useEffect } from "react";
import { X, Sparkles, Video, RotateCw, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface VideoRecorderProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (videoFile: File) => void;
}

const VERTEX_SHADER_SOURCE = `
  attribute vec2 position;
  varying vec2 vTextureCoord;
  void main() {
    vTextureCoord = vec2(position.x * 0.5 + 0.5, 0.5 - position.y * 0.5);
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER_SOURCE = `
  precision mediump float;
  varying vec2 vTextureCoord;
  uniform sampler2D uSampler;
  uniform vec2 uTextureSize;
  uniform bool uSmoothingEnabled;

  const float SIGMA = 2.0;
  const float BSIGMA = 0.12;
  const int MSIZE = 4;

  void main() {
    vec4 centerColor = texture2D(uSampler, vTextureCoord);
    
    if (!uSmoothingEnabled) {
      gl_FragColor = centerColor;
      return;
    }

    // Fast skin tone detection
    float r = centerColor.r;
    float g = centerColor.g;
    float b = centerColor.b;
    
    bool isSkin = (r > 0.35 && g > 0.25 && b > 0.2 && 
                  r > g && r > b && 
                  (r - g) > 0.05 && 
                  (max(r, max(g, b)) - min(r, min(g, b))) > 0.05);

    if (!isSkin) {
      gl_FragColor = centerColor;
      return;
    }

    // Bilateral Filter for skin smoothing
    vec4 sum = vec4(0.0);
    float factorSum = 0.0;
    
    float sigmaSig2 = 2.0 * SIGMA * SIGMA;
    float bSigmaSig2 = 2.0 * BSIGMA * BSIGMA;

    for (int i = -MSIZE; i <= MSIZE; i++) {
      for (int j = -MSIZE; j <= MSIZE; j++) {
        vec2 offset = vec2(float(i), float(j)) / uTextureSize;
        vec4 col = texture2D(uSampler, vTextureCoord + offset);
        
        float dist2 = float(i * i + j * j);
        float gSpace = exp(-dist2 / sigmaSig2);
        
        vec3 diff = col.rgb - centerColor.rgb;
        float distColor2 = dot(diff, diff);
        float gColor = exp(-distColor2 / bSigmaSig2);
        
        float factor = gSpace * gColor;
        sum += col * factor;
        factorSum += factor;
      }
    }
    
    gl_FragColor = sum / factorSum;
  }
`;

export const VideoRecorder = ({ isOpen, onClose, onSave }: VideoRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [useBeautyFilter, setUseBeautyFilter] = useState(true);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingProgress, setRecordingProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const textureRef = useRef<WebGLTexture | null>(null);

  const RECORD_LIMIT_SEC = 15;

  // Initialize WebGL Program
  const initWebGL = (gl: WebGLRenderingContext) => {
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs!, VERTEX_SHADER_SOURCE);
    gl.compileShader(vs!);

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs!, FRAGMENT_SHADER_SOURCE);
    gl.compileShader(fs!);

    const program = gl.createProgram();
    gl.attachShader(program!, vs!);
    gl.attachShader(program!, fs!);
    gl.linkProgram(program!);
    gl.useProgram(program!);

    // Position coordinates
    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program!, "position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Texture config
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    glRef.current = gl;
    programRef.current = program;
    textureRef.current = texture;
  };

  // Start Camera Stream
  const startStream = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      // Constrain to vertical HD size (720x1280) for TikTok-like aspect ratio
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          aspectRatio: { ideal: 9 / 16 },
        },
        audio: true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      toast.error("Failed to access camera. Please check permissions.");
    }
  };

  useEffect(() => {
    if (isOpen) {
      setRecordedBlob(null);
      setRecordingProgress(0);
      startStream();
    } else {
      stopAll();
    }
    return () => stopAll();
  }, [isOpen, facingMode]);

  // Handle Shader Render Loop
  useEffect(() => {
    if (!isOpen || !videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });

    if (!gl) {
      console.warn("WebGL not supported. Fallback to 2D canvas.");
      return;
    }

    initWebGL(gl);

    const render = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // Set canvas aspect ratio matching vertical viewport
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);

        // Upload new frame as texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textureRef.current);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);

        // Set uniforms
        const sizeLocation = gl.getUniformLocation(programRef.current!, "uTextureSize");
        gl.uniform2f(sizeLocation, canvas.width, canvas.height);

        const filterLocation = gl.getUniformLocation(programRef.current!, "uSmoothingEnabled");
        gl.uniform1i(filterLocation, useBeautyFilter ? 1 : 0);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, useBeautyFilter]);

  const stopAll = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
  };

  // Start Video Recording
  const startRecording = () => {
    if (!canvasRef.current || !streamRef.current) return;

    const canvasStream = canvasRef.current.captureStream(30); // 30 FPS video track
    const audioTrack = streamRef.current.getAudioTracks()[0];

    // Combine WebGL filtered canvas video stream with microphone audio
    if (audioTrack) {
      canvasStream.addTrack(audioTrack.clone());
    }

    let options = { mimeType: "video/webm;codecs=vp9,opus" };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: "video/webm;codecs=vp8,opus" };
    }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: "video/mp4" };
    }

    try {
      const chunks: Blob[] = [];
      const mediaRecorder = new MediaRecorder(canvasStream, options);
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: options.mimeType });
        setRecordedBlob(blob);
        setIsRecording(false);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingProgress(0);

      // Progress Timer
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const progress = Math.min((elapsed / RECORD_LIMIT_SEC) * 100, 100);
        setRecordingProgress(progress);

        if (elapsed >= RECORD_LIMIT_SEC) {
          clearInterval(interval);
          stopRecording();
        }
      }, 50);

      (mediaRecorder as any).progressInterval = interval;

    } catch (e) {
      console.error("Recording setup error:", e);
      toast.error("Failed to start recording. Please try again.");
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      if ((recorder as any).progressInterval) {
        clearInterval((recorder as any).progressInterval);
      }
      recorder.stop();
    }
  };

  const saveVideo = () => {
    if (!recordedBlob) return;
    const file = new File([recordedBlob], "recorded_hair_post.webm", {
      type: recordedBlob.type,
    });
    onSave(file);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between text-white overflow-hidden select-none">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between px-6 py-4 z-10 bg-gradient-to-b from-black/60 to-transparent">
        <button onClick={onClose} className="p-2 bg-black/40 rounded-full hover:bg-black/60 transition-colors">
          <X size={20} />
        </button>
        
        {/* Progress Bar Container */}
        {isRecording && (
          <div className="flex-1 mx-6 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-75"
              style={{ width: `${recordingProgress}%` }}
            />
          </div>
        )}

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setUseBeautyFilter(!useBeautyFilter)}
            className={`p-2 rounded-full transition-colors flex items-center gap-1.5 text-xs font-semibold ${
              useBeautyFilter ? "bg-primary text-primary-foreground" : "bg-black/40 text-white"
            }`}
          >
            <Sparkles size={16} />
            {useBeautyFilter ? "Smooth On" : "Smooth Off"}
          </button>
          
          {!isRecording && !recordedBlob && (
            <button 
              onClick={() => setFacingMode(facingMode === "user" ? "environment" : "user")}
              className="p-2 bg-black/40 rounded-full hover:bg-black/60 transition-colors"
            >
              <RotateCw size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Main View Area */}
      <div className="relative flex-1 w-full max-w-md mx-auto aspect-[9/16] bg-neutral-900 overflow-hidden flex items-center justify-center">
        {/* Real hidden video element */}
        <video 
          ref={videoRef} 
          muted 
          playsInline 
          className="hidden" 
        />
        
        {/* WebGL Output Render Screen */}
        {!recordedBlob ? (
          <canvas 
            ref={canvasRef} 
            className="w-full h-full object-cover max-h-[80vh] border border-neutral-800 rounded-2xl" 
          />
        ) : (
          <video 
            src={URL.createObjectURL(recordedBlob)} 
            controls 
            loop 
            playsInline 
            className="w-full h-full object-cover max-h-[80vh] border border-neutral-800 rounded-2xl" 
          />
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="w-full py-8 flex items-center justify-center gap-8 bg-gradient-to-t from-black/80 to-transparent z-10">
        {!recordedBlob ? (
          // Recording Button View
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all ${
                isRecording ? "scale-90 bg-red-600 rounded-2xl" : "bg-red-500 hover:bg-red-400"
              }`}
            >
              <Video size={32} className="text-white" />
            </button>
            <span className="text-xs text-neutral-400 mt-1">
              {isRecording ? "Tap to Stop" : "Tap to Record (Max 15s)"}
            </span>
          </div>
        ) : (
          // Review & Approve View
          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                setRecordedBlob(null);
                setRecordingProgress(0);
                startStream();
              }}
              className="px-6 py-3 bg-neutral-800 text-white rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-neutral-700 transition-colors"
            >
              <RotateCw size={16} />
              Re-record
            </button>
            <button
              onClick={saveVideo}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Check size={16} />
              Use Video
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
