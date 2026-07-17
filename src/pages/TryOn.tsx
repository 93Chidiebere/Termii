import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, RefreshCw, Sparkles, AlertCircle, ShoppingBag, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Hairstyle {
  id: string;
  name: string;
  src: string;
}

const HAIRSTYLES: Hairstyle[] = [
  { id: "afro_puff", name: "Afro Puff", src: "/assets/hairstyles/afro_puff.png" },
  { id: "box_braids", name: "Box Braids", src: "/assets/hairstyles/box_braids.png" },
  { id: "locs", name: "Short Locs", src: "/assets/hairstyles/locs.png" }
];

const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
};

const TryOn = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLImageElement>(null);
  const [selectedHair, setSelectedHair] = useState<string>("afro_puff");
  const [isLoading, setIsLoading] = useState(true);
  const [hasCamera, setHasCamera] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Keep a ref to the active MediaPipe camera and faceMesh instance
  const cameraInstanceRef = useRef<any>(null);
  const faceMeshRef = useRef<any>(null);

  useEffect(() => {
    let active = true;

    const initFaceTracking = async () => {
      try {
        setIsLoading(true);
        setErrorMsg(null);

        // 1. Request Webcam Permission & Stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setHasCamera(true);

        // 2. Load MediaPipe dependencies dynamically from CDN
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js");

        if (!active) {
          // Cleanup stream if component unmounted while loading scripts
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        // 3. Initialize MediaPipe Face Mesh
        const mpFaceMesh = (window as any).FaceMesh;
        const mpCamera = (window as any).Camera;

        if (!mpFaceMesh || !mpCamera) {
          throw new Error("Failed to load MediaPipe from CDN");
        }

        const faceMesh = new mpFaceMesh({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        });

        faceMeshRef.current = faceMesh;

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        faceMesh.onResults((results: any) => {
          if (!active || !videoRef.current || !overlayRef.current) return;

          if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const landmarks = results.multiFaceLandmarks[0];

            const forehead = landmarks[10];
            const chin = landmarks[152];
            const leftEye = landmarks[33];
            const rightEye = landmarks[263];

            const width = videoRef.current.offsetWidth;
            const height = videoRef.current.offsetHeight;

            // Dimensions of face
            const faceHeight = Math.abs(forehead.y - chin.y) * height;
            const faceWidth = Math.abs(leftEye.x - rightEye.x) * width;

            // Scales and offsets optimized per hairstyle for a natural overlay fit
            let widthScale = 2.4;
            let heightScale = 2.0;
            let yOffset = faceHeight * 0.55;

            if (selectedHair === "afro_puff") {
              widthScale = 2.8;
              heightScale = 2.4;
              yOffset = faceHeight * 0.70;
            } else if (selectedHair === "box_braids") {
              widthScale = 2.6;
              heightScale = 2.8;
              yOffset = faceHeight * 0.40;
            } else if (selectedHair === "locs") {
              widthScale = 2.8;
              heightScale = 2.6;
              yOffset = faceHeight * 0.45;
            }

            const hairWidth = faceWidth * widthScale;
            const hairHeight = faceWidth * heightScale;

            // Positioning relative to forehead landmark
            const x = forehead.x * width;
            const y = forehead.y * height - yOffset;

            // Face rotation (roll angle) in degrees
            const dx = (rightEye.x - leftEye.x) * width;
            const dy = (rightEye.y - leftEye.y) * height;
            const angleRad = Math.atan2(dy, dx);
            const angleDeg = (angleRad * 180) / Math.PI;

            if (overlayRef.current) {
              overlayRef.current.style.display = "block";
              overlayRef.current.style.width = `${hairWidth}px`;
              overlayRef.current.style.height = `${hairHeight}px`;
              overlayRef.current.style.left = `${x - hairWidth / 2}px`;
              overlayRef.current.style.top = `${y - hairHeight / 2}px`;
              overlayRef.current.style.transform = `rotate(${angleDeg}deg)`;
            }
          } else {
            // Hide overlay if face isn't fully in frame
            if (overlayRef.current) {
              overlayRef.current.style.display = "none";
            }
          }
        });

        // 4. Start MediaPipe Camera Frame Loop
        const camera = new mpCamera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current) {
              await faceMesh.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480
        });

        cameraInstanceRef.current = camera;
        camera.start();
        setIsLoading(false);
      } catch (err: any) {
        console.error("Camera try-on initialization failed:", err);
        setErrorMsg(
          err.name === "NotAllowedError"
            ? "Camera permission denied. Please allow camera access in your browser settings."
            : "Could not initialize face tracking. Please check your camera connection."
        );
        setIsLoading(false);
      }
    };

    initFaceTracking();

    return () => {
      active = false;
      // Stop camera and release tracks
      if (cameraInstanceRef.current) {
        cameraInstanceRef.current.stop();
      }
      if (faceMeshRef.current) {
        faceMeshRef.current.close();
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [selectedHair]);

  // Capture try-on screenshot watermarked with Isi Ngala logo
  const handleCapture = () => {
    if (!videoRef.current || !overlayRef.current || isCapturing) return;

    setIsCapturing(true);
    const video = videoRef.current;
    const overlay = overlayRef.current;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsCapturing(false);
      return;
    }

    // 1. Draw mirrored webcam frames
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // 2. Draw transparency overlay
    const overlayWidth = parseFloat(overlay.style.width);
    const overlayHeight = parseFloat(overlay.style.height);
    const overlayLeft = parseFloat(overlay.style.left);
    const overlayTop = parseFloat(overlay.style.top);

    const scaleX = canvas.width / video.clientWidth;
    const scaleY = canvas.height / video.clientHeight;

    const w = overlayWidth * scaleX;
    const h = overlayHeight * scaleY;
    const cx = (overlayLeft + overlayWidth / 2) * scaleX;
    const cy = (overlayTop + overlayHeight / 2) * scaleY;

    const transformStyle = overlay.style.transform;
    let angleDeg = 0;
    const match = transformStyle.match(/rotate\(([-\d.]+)deg\)/);
    if (match) {
      angleDeg = parseFloat(match[1]);
    }

    ctx.save();
    ctx.translate(cx, cy);
    // Negate the rotation to align correctly with the mirrored canvas image
    ctx.rotate((-angleDeg * Math.PI) / 180);

    const img = new Image();
    img.src = overlay.src;
    img.onload = () => {
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();

      // 3. Draw Watermark logo
      ctx.save();
      ctx.font = "bold 22px serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
      ctx.shadowBlur = 6;
      ctx.fillText("Isi Ngala", canvas.width - 140, canvas.height - 45);

      ctx.font = "12px sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.fillText("Virtual Try-On", canvas.width - 140, canvas.height - 25);
      ctx.restore();

      // Save screenshot
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `isingala_tryon_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      toast.success("Snapshot saved to your gallery!");
      setIsCapturing(false);
    };
    img.onerror = () => {
      setIsCapturing(false);
      toast.error("Failed to capture image");
    };
  };

  const currentHairName = HAIRSTYLES.find(h => h.id === selectedHair)?.name || "";

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col min-h-[calc(100vh-6rem)]">
        {/* Back header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="text-primary animate-pulse" size={20} />
              Hairstyle Try-On
            </h1>
            <p className="text-xs text-muted-foreground">Virtual hairstyle preview</p>
          </div>
        </div>

        {/* Webcam Viewfinder */}
        <div className="relative aspect-[3/4] w-full rounded-3xl overflow-hidden border-2 border-primary/20 bg-black shadow-xl flex items-center justify-center">
          {isLoading && (
            <div className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center gap-3 z-10">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm text-sidebar-foreground/60 font-medium">Initializing camera & face tracking...</p>
            </div>
          )}

          {errorMsg && (
            <div className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center p-6 text-center gap-4 z-20">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">Setup Error</p>
                <p className="text-xs text-sidebar-foreground/60 max-w-xs">{errorMsg}</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <RefreshCw size={14} /> Retry Camera
              </button>
            </div>
          )}

          {/* Mirrored container so coordinates and video mirror in sync */}
          <div className="relative w-full h-full scale-x-[-1] overflow-hidden">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
            />
            {/* Transparent png overlay representing selected wig */}
            <img
              ref={overlayRef}
              src={HAIRSTYLES.find(h => h.id === selectedHair)?.src}
              className="absolute pointer-events-none origin-center select-none"
              style={{ display: "none" }}
              alt="Hairstyle overlay"
            />
          </div>

          {/* Top Info overlay */}
          {!isLoading && !errorMsg && hasCamera && (
            <div className="absolute top-4 left-4 right-4 py-2 px-3 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-center pointer-events-none scale-x-[1]">
              <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Active Look</p>
              <p className="text-sm font-bold text-primary mt-0.5">{currentHairName}</p>
            </div>
          )}
        </div>

        {/* Hairstyle Selector & Call to Actions */}
        {!errorMsg && (
          <div className="mt-6 space-y-6 flex-1 flex flex-col justify-end">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select Hairstyle</p>
              <div className="grid grid-cols-3 gap-3">
                {HAIRSTYLES.map((hair) => (
                  <button
                    key={hair.id}
                    onClick={() => setSelectedHair(hair.id)}
                    className={`py-3.5 px-3 rounded-2xl border text-center transition-all ${
                      selectedHair === hair.id
                        ? "bg-primary/10 border-primary text-primary shadow-sm font-bold scale-[1.02]"
                        : "bg-card border-border text-foreground hover:bg-muted text-sm font-semibold"
                    }`}
                  >
                    {hair.name}
                  </button>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCapture}
                disabled={isLoading || isCapturing}
                className="flex-1 py-4 rounded-2xl bg-neutral-900 text-white font-bold text-sm hover:bg-neutral-850 transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                {isCapturing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Camera size={16} />
                )}
                Take Snapshot
              </button>

              <Link
                to="/marketplace"
                className="px-5 py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg"
              >
                <ShoppingBag size={16} />
                Book Stylist
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default TryOn;
