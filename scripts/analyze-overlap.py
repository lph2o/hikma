from PIL import Image

im = Image.open(
    "/var/folders/40/s58910lx3hv8m741krjkngfr0000gn/T/freebuff-desktop-pastes/paste-1787943717722-633.png"
).convert("RGB")
W, H = im.size
px = im.load()
print("size", W, H)

# Ligne de temps : chercher les graduations 0s..19s (texte clair sur fond sombre)
# et le playhead doré. D'abord : localiser les bandes claires (texte des graduations).
# On cherche la rangée contenant beaucoup de pixels clairs (texte de la règle).
rows = []
for y in range(H):
    bright = 0
    for x in range(0, W, 4):
        r, g, b = px[x, y]
        if r + g + b > 500:
            bright += 1
    rows.append(bright)

# bande de la règle : première zone avec > 15 pixels clairs par ligne, dans la moitié basse
ruler_top = None
for y in range(H // 2, H):
    if rows[y] > 15:
        ruler_top = y
        break
print("ruler_top =", ruler_top)

# Canvas 9:16 : chercher la zone de preview (dégradé vert foncé #0b2326..#041113)
# Colonne centrale : détecter les bords du cadre téléphone (ring blanc/10)
# Cherchons les colonnes contenant le fond du player (teal très sombre)
def col_is_player_bg(x, y):
    r, g, b = px[x, y]
    # dégradé teal sombre : g > r, b ~ r, luminosité faible (10..60)
    return g > r and abs(g - b) < 40 and r < 60 and g < 70

# Pour plusieurs lignes au centre, trouver l'étendue horizontale du player
print("--- profil vertical du centre (x = W//2) ---")
for y in range(0, H, 20):
    r, g, b = px[W // 2, y]
    tag = "PLAYER" if col_is_player_bg(W // 2, y) else ("BRIGHT" if r + g + b > 400 else "")
    print(y, (r, g, b), tag)
