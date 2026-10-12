import os

def create_demo_photos():
    target_dir = os.path.join("frontend", "public", "demo_photos")
    os.makedirs(target_dir, exist_ok=True)

    def make_svg(title, subtitle, color):
        return f'''<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250">
  <rect width="400" height="250" fill="#1e293b"/>
  <rect x="10" y="10" width="380" height="230" rx="12" fill="#0f172a" stroke="#334155" stroke-width="2"/>
  <circle cx="200" cy="95" r="45" fill="{color}" opacity="0.2"/>
  <path d="M170 95 Q 200 65 230 95 T 200 125 Z" fill="{color}"/>
  <text x="200" y="165" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#f8fafc" text-anchor="middle">{title}</text>
  <text x="200" y="190" font-family="Arial, sans-serif" font-size="12" fill="#94a3b8" text-anchor="middle">{subtitle}</text>
  <text x="200" y="215" font-family="monospace" font-size="10" fill="#38bdf8" text-anchor="middle">GPS: 53.2500° N, 69.2000° E • 2026-10</text>
</svg>'''

    for i in range(1, 5):
        path = os.path.join(target_dir, f"pothole_{i}.jpg")
        with open(path, "w", encoding="utf-8") as f:
            f.write(make_svg(f"Выбоина асфальта #{i}", "Глубина 7.5 см, площадь 2.1 кв.м", "#ef4444"))

        path = os.path.join(target_dir, f"defect_{i}.jpg")
        with open(path, "w", encoding="utf-8") as f:
            f.write(make_svg(f"Дорожный дефект #{i}", "Сетка трещин и просадка полотна", "#f59e0b"))

    for i in range(1, 4):
        path = os.path.join(target_dir, f"fixed_{i}.jpg")
        with open(path, "w", encoding="utf-8") as f:
            f.write(make_svg(f"Устранено #{i} (Ямочный ремонт)", "Асфальтобетон уложен и уплотнен", "#10b981"))

    print("OK: Demo photos generated successfully.")

if __name__ == "__main__":
    create_demo_photos()
