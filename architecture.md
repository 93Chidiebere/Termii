# Isi Ngala - Infrastructure Migration Notes
Version: 2.0
Date: July 2026

---

# Purpose

This document records a major infrastructure change made to the Isi Ngala backend. Any future architectural advice, deployment recommendations or code modifications should assume this document represents the current production state.

---

# Previous Architecture

The application previously used Railway for both backend hosting and MongoDB database hosting.

```
Frontend (Vercel)
        │
        ▼
Backend (Railway)
        │
        ▼
MongoDB (Railway)
```

Characteristics:

- FastAPI backend deployed on Railway.
- MongoDB hosted as a Railway service.
- Persistent Railway Volume attached to MongoDB.
- Database connection used Railway internal/public MongoDB URI.
- Entire backend stack existed within Railway.

---

# Reason for Migration

Railway usage analysis showed the MongoDB service consumed the majority of infrastructure cost.

Measured costs before migration:

| Service | Approximate Cost |
|----------|-----------------:|
| MongoDB | ~$1.55 |
| Backend (FastAPI) | ~$0.87 |
| Total | ~$2.40 |

MongoDB represented approximately 65% of total Railway infrastructure cost.

The application database was only approximately:

- 57 documents
- 9 collections
- 0.54 MB total size

Therefore hosting MongoDB on Railway was unnecessary.

---

# Current Production Architecture

```
Frontend (Vercel)
        │
        ▼
Backend (Railway)
        │
        ▼
MongoDB Atlas (M0 Free Tier)
        │
        ▼
Cloudinary (Media Storage)
        │
        ▼
Paystack (Payments)
```

Current responsibilities:

Frontend:
- Vercel

Backend:
- Railway

Database:
- MongoDB Atlas

Images & Videos:
- Cloudinary

Payments:
- Paystack

---

# MongoDB

MongoDB is no longer hosted on Railway.

Production database now resides on:

MongoDB Atlas (Free M0 Cluster)

Characteristics:

- Atlas Cluster
- MongoDB Atlas authentication
- Atlas connection string
- Managed MongoDB service
- Railway MongoDB removed from architecture (or scheduled for removal after verification)

Future recommendations should assume MongoDB Atlas is the production database.

Do NOT recommend Railway MongoDB unless there is a strong technical reason.

---

# Database Migration

Migration performed using MongoDB Database Tools.

Backup:

mongodump

Restore:

mongorestore

Purpose:

- Preserve production data
- Preserve indexes
- Maintain collection structure

Collections migrated:

- users
- posts
- products
- orders
- messages
- follows
- blog_posts
- post_comments
- post_likes

---

# Production Connection

Previous:

```
Railway MongoDB URI
```

Current:

```
MongoDB Atlas SRV URI
```

Backend environment variable:

```
MONGODB_URI
```

now points to MongoDB Atlas.

Any future deployment advice should preserve this configuration.

---

# Infrastructure Goals

Current objectives:

- Minimize infrastructure cost
- Improve portability
- Keep services loosely coupled
- Follow cloud-native architecture
- Separate compute from storage

---

# Engineering Decisions

The project intentionally separates concerns.

Current stack:

Frontend:
- Vercel

Backend:
- Railway

Database:
- MongoDB Atlas

Media:
- Cloudinary

Payments:
- Paystack

This separation should be preserved whenever possible.

---

# Cost Optimization

The migration was performed primarily for infrastructure optimization.

Expected Railway savings:

Approximately 65%.

Future recommendations should continue prioritizing:

- free tiers where appropriate
- managed services
- scalable cloud architecture
- avoiding unnecessary infrastructure costs

---

# Development Philosophy

Isi Ngala is an active learning project.

The owner is a Data Scientist intentionally using this project to improve:

- Software Engineering
- Backend Engineering
- Cloud Engineering
- DevOps
- System Design

Recommendations should therefore:

- explain architectural decisions
- explain trade-offs
- prefer production-grade approaches
- teach engineering principles instead of only providing code

---

# AI Assistant Guidance

When suggesting future improvements:

Assume:

✓ MongoDB Atlas is production.
✓ Railway only hosts backend compute.
✓ Cloudinary stores media.
✓ Vercel hosts frontend.
✓ Infrastructure cost matters.
✓ Production safety is preferred over convenience.

Avoid suggesting:

- moving MongoDB back into Railway
- tightly coupling services
- replacing Atlas without strong justification

Instead prefer:

- scalable architecture
- managed cloud services
- cost-efficient infrastructure
- production deployment practices
- monitoring
- backups
- observability
- security improvements
- CI/CD improvements

---

End of document.