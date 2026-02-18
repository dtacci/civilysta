# Future Ideas (the "if we win" file)

Notes on ambitious ideas worth revisiting if Civilysta actually takes off.

---

## Home Cluster for Local AI Inference

**The idea:** Run a small k3s cluster on 2-3 spare 16GB MacBook Pros (M1/M3) for local
AI inference, keeping web serving on Vercel/VPS.

**Why it could make sense:**
- AI API costs dominate at scale (~$3k/mo at 50k causes/month, mostly image generation)
- M1/M3 are decent inference machines (Llama 3.1 8B at ~30-40 tok/sec via Ollama)
- Hybrid architecture: cloud for web serving, home cluster for inference over Tailscale/WireGuard
- Falls back to cloud APIs gracefully if the cluster goes down
- Breaks even vs API costs around 5k-8k causes/month

**Architecture sketch:**
```
[Vercel / VPS] --VPN tunnel--> [Home MacBooks running Ollama + image gen]
                                with Postgres job queue for buffering
```

**The reality check (Feb 2025):**
- Local image generation (Stable Diffusion / SDXL via MLX) is a FAR cry from Imagen or
  DALL-E quality. For photorealistic hero images on cause pages, cloud APIs win by a mile.
  Local gen might work for avatars or abstract graphics, but not the quality bar we want.
- Text generation is more viable locally (Llama quality is close to GPT-4o-mini for
  structured copy generation), BUT API prices for text are dropping so fast that the
  cost savings may never justify the ops overhead.
- k3s is probably overkill — Ollama behind a simple HTTP API is way less complexity.
- Running 3 laptops 24/7 costs ~$15-25/mo in electricity alone.

**Verdict:** Cool project, probably not economically rational unless image gen models
catch up dramatically on quality OR API pricing stops its downward trend. Revisit when
either condition changes. The spare MacBooks aren't going anywhere.

---

*Add more "if we win" ideas below as they come up.*
