import os

RESSOURCES_DIR = os.path.join(os.path.dirname(__file__), "ressources")

MODEL_XWINS_PATH = os.path.join(RESSOURCES_DIR, "model_xwins.pkl")
MODEL_DRAW_PATH  = os.path.join(RESSOURCES_DIR, "model_draw.pkl")

MINIMAX_DEFAULT_DEPTH = 3
API_PORT = 5000
