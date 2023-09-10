# Discord Interface

To run this locally, ensure you have Bun installed. If you don't, install it now:

```bash
curl -fsSL https://bun.sh/install | bash
```

Then, install all dependencies:

```bash
bun i
```

---

- For production, run `bun start`.
- For development, run `bun dev`, which enables verbose logging. This component does not use automatic reloading because you would get very quickly ratelimited by the Discord API.