import os
from fastapi import APIRouter, Request, Form
from fastapi.responses import RedirectResponse, HTMLResponse
from jinja2 import Environment, FileSystemLoader, select_autoescape
from app import database as db
from app.config import DEFAULT_CHAT_ID
from app.sstats_client import SStatsClient

router = APIRouter()

# Путь к шаблонам
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATES_DIR = os.path.join(CURRENT_DIR, "templates")

# Создаём окружение Jinja2 без кэша (надёжно)
env = Environment(
    loader=FileSystemLoader(TEMPLATES_DIR),
    autoescape=select_autoescape(['html', 'xml']),
    cache_size=0,          # полностью отключаем кэш
    auto_reload=True,      # перезагружать при изменениях
)

CHAT_ID = DEFAULT_CHAT_ID

# Вспомогательная функция для рендеринга шаблонов
def render_template(template_name: str, context: dict):
    template = env.get_template(template_name)
    return HTMLResponse(content=template.render(**context))

@router.get("/")
async def index(request: Request):
    user_id = db.get_user_id(CHAT_ID)
    if not user_id:
        user_id = db.create_user(CHAT_ID)
    filters = db.get_active_filters(user_id)
    return render_template("index.html", {"request": request, "filters": filters})

@router.get("/filter/new")
async def new_filter(request: Request):
    return render_template("filter_form.html", {"request": request})

@router.post("/filter/save")
async def save_filter(
    request: Request,
    match_time_min: int = Form(...),
    match_time_max: int = Form(...),
    total_goals_min: int = Form(...), total_goals_max: int = Form(...),
    total_corners_min: int = Form(...), total_corners_max: int = Form(...),
    total_shots_min: int = Form(...), total_shots_max: int = Form(...),
    total_sot_min: int = Form(...), total_sot_max: int = Form(...),
    total_yellow_min: int = Form(...), total_yellow_max: int = Form(...),
    home_goals_min: int = Form(...), home_goals_max: int = Form(...),
    away_goals_min: int = Form(...), away_goals_max: int = Form(...),
    home_corners_min: int = Form(...), home_corners_max: int = Form(...),
    away_corners_min: int = Form(...), away_corners_max: int = Form(...),
    home_shots_min: int = Form(...), home_shots_max: int = Form(...),
    away_shots_min: int = Form(...), away_shots_max: int = Form(...),
    home_sot_min: int = Form(...), home_sot_max: int = Form(...),
    away_sot_min: int = Form(...), away_sot_max: int = Form(...),
    home_yellow_min: int = Form(...), home_yellow_max: int = Form(...),
    away_yellow_min: int = Form(...), away_yellow_max: int = Form(...),
    h2h_matches_count: int = Form(...),
    h2h_avg_goals_min: float = Form(...), h2h_avg_goals_max: float = Form(...),
    home_recent_count: int = Form(...),
    home_recent_goals_min: float = Form(...), home_recent_goals_max: float = Form(...),
    away_recent_count: int = Form(...),
    away_recent_goals_min: float = Form(...), away_recent_goals_max: float = Form(...),
    odds_p1_min: float = Form(...), odds_p1_max: float = Form(...),
    odds_p2_min: float = Form(...), odds_p2_max: float = Form(...),
    odds_draw_min: float = Form(...), odds_draw_max: float = Form(...),
    odds_total_over_2_5_min: float = Form(...), odds_total_over_2_5_max: float = Form(...),
    diff_goals_min: int = Form(...), diff_goals_max: int = Form(...),
    diff_corners_min: int = Form(...), diff_corners_max: int = Form(...),
    diff_shots_min: int = Form(...), diff_shots_max: int = Form(...),
    diff_sot_min: int = Form(...), diff_sot_max: int = Form(...),
    diff_yellow_min: int = Form(...), diff_yellow_max: int = Form(...),
):
    user_id = db.get_user_id(CHAT_ID)
    if not user_id:
        user_id = db.create_user(CHAT_ID)
    data = {
        'match_time_min': match_time_min, 'match_time_max': match_time_max,
        'total_goals_min': total_goals_min, 'total_goals_max': total_goals_max,
        'total_corners_min': total_corners_min, 'total_corners_max': total_corners_max,
        'total_shots_min': total_shots_min, 'total_shots_max': total_shots_max,
        'total_sot_min': total_sot_min, 'total_sot_max': total_sot_max,
        'total_yellow_min': total_yellow_min, 'total_yellow_max': total_yellow_max,
        'home_goals_min': home_goals_min, 'home_goals_max': home_goals_max,
        'away_goals_min': away_goals_min, 'away_goals_max': away_goals_max,
        'home_corners_min': home_corners_min, 'home_corners_max': home_corners_max,
        'away_corners_min': away_corners_min, 'away_corners_max': away_corners_max,
        'home_shots_min': home_shots_min, 'home_shots_max': home_shots_max,
        'away_shots_min': away_shots_min, 'away_shots_max': away_shots_max,
        'home_sot_min': home_sot_min, 'home_sot_max': home_sot_max,
        'away_sot_min': away_sot_min, 'away_sot_max': away_sot_max,
        'home_yellow_min': home_yellow_min, 'home_yellow_max': home_yellow_max,
        'away_yellow_min': away_yellow_min, 'away_yellow_max': away_yellow_max,
        'h2h_matches_count': h2h_matches_count,
        'h2h_avg_goals_min': h2h_avg_goals_min, 'h2h_avg_goals_max': h2h_avg_goals_max,
        'home_recent_count': home_recent_count,
        'home_recent_goals_min': home_recent_goals_min, 'home_recent_goals_max': home_recent_goals_max,
        'away_recent_count': away_recent_count,
        'away_recent_goals_min': away_recent_goals_min, 'away_recent_goals_max': away_recent_goals_max,
        'odds_p1_min': odds_p1_min, 'odds_p1_max': odds_p1_max,
        'odds_p2_min': odds_p2_min, 'odds_p2_max': odds_p2_max,
        'odds_draw_min': odds_draw_min, 'odds_draw_max': odds_draw_max,
        'odds_total_over_2_5_min': odds_total_over_2_5_min, 'odds_total_over_2_5_max': odds_total_over_2_5_max,
        'diff_goals_min': diff_goals_min, 'diff_goals_max': diff_goals_max,
        'diff_corners_min': diff_corners_min, 'diff_corners_max': diff_corners_max,
        'diff_shots_min': diff_shots_min, 'diff_shots_max': diff_shots_max,
        'diff_sot_min': diff_sot_min, 'diff_sot_max': diff_sot_max,
        'diff_yellow_min': diff_yellow_min, 'diff_yellow_max': diff_yellow_max,
    }
    db.save_filter(user_id, data)
    return RedirectResponse("/", status_code=303)

@router.get("/leagues")
async def leagues_page(request: Request):
    user_id = db.get_user_id(CHAT_ID)
    if not user_id:
        user_id = db.create_user(CHAT_ID)
    client = SStatsClient()
    all_leagues = client.get_leagues()
    blacklisted = db.get_blacklisted_leagues_full(user_id)
    blacklist_ids = [b['id'] for b in blacklisted]
    return render_template("leagues.html", {
        "request": request,
        "all_leagues": all_leagues,
        "blacklisted_ids": blacklist_ids
    })

@router.post("/blacklist/add")
async def add_blacklist(request: Request, league_id: int = Form(...), league_name: str = Form(...)):
    user_id = db.get_user_id(CHAT_ID)
    if user_id:
        db.add_blacklisted_league(user_id, league_id, league_name)
    return RedirectResponse("/leagues", status_code=303)

@router.post("/blacklist/remove")
async def remove_blacklist(request: Request, league_id: int = Form(...)):
    user_id = db.get_user_id(CHAT_ID)
    if user_id:
        db.remove_blacklisted_league(user_id, league_id)
    return RedirectResponse("/leagues", status_code=303)