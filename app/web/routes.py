from fastapi import APIRouter, Request, Form
from fastapi.responses import RedirectResponse, HTMLResponse
from jinja2 import Environment, FileSystemLoader, select_autoescape
from app import database as db
from app.sstats_client import SStatsClient
import logging
import os
import json

logger = logging.getLogger(__name__)

router = APIRouter()

template_dir = os.path.join(os.path.dirname(__file__), "templates")
env = Environment(
    loader=FileSystemLoader(template_dir),
    autoescape=select_autoescape(['html', 'xml']),
    cache_size=0,
    auto_reload=True
)

def clean_chat_id(raw: str) -> int:
    if not raw:
        raise ValueError("Missing chat_id")
    cleaned = raw.strip().rstrip('.')
    return int(cleaned)

def extract_team_names(match_data: dict) -> tuple:
    """
    Извлекает названия команд из match_data, перебирая возможные ключи.
    Возвращает (home_name, away_name).
    """
    home_name = 'Неизвестно'
    away_name = 'Неизвестно'

    if not match_data:
        return home_name, away_name

    # Если match_data - строка, пробуем распарсить как JSON
    if isinstance(match_data, str):
        try:
            match_data = json.loads(match_data)
        except:
            return home_name, away_name

    # Рекурсивный обход для поиска ключей 'home' и 'away' с name
    def find_names(obj):
        nonlocal home_name, away_name
        if isinstance(obj, dict):
            # Проверяем ключи на наличие названий команд
            if 'home' in obj and isinstance(obj['home'], dict):
                if 'name' in obj['home'] and obj['home']['name']:
                    home_name = obj['home']['name']
                elif 'team_name' in obj['home'] and obj['home']['team_name']:
                    home_name = obj['home']['team_name']
                elif 'title' in obj['home'] and obj['home']['title']:
                    home_name = obj['home']['title']
            if 'away' in obj and isinstance(obj['away'], dict):
                if 'name' in obj['away'] and obj['away']['name']:
                    away_name = obj['away']['name']
                elif 'team_name' in obj['away'] and obj['away']['team_name']:
                    away_name = obj['away']['team_name']
                elif 'title' in obj['away'] and obj['away']['title']:
                    away_name = obj['away']['title']

            # Если есть 'home_team' и 'away_team' напрямую
            if 'home_team' in obj and isinstance(obj['home_team'], str):
                home_name = obj['home_team']
            if 'away_team' in obj and isinstance(obj['away_team'], str):
                away_name = obj['away_team']

            # Если есть 'team1' и 'team2'
            if 'team1' in obj and isinstance(obj['team1'], str):
                home_name = obj['team1']
            if 'team2' in obj and isinstance(obj['team2'], str):
                away_name = obj['team2']

            # Если есть 'homeName' и 'awayName'
            if 'homeName' in obj and isinstance(obj['homeName'], str):
                home_name = obj['homeName']
            if 'awayName' in obj and isinstance(obj['awayName'], str):
                away_name = obj['awayName']

            # Рекурсивно обходим все значения
            for value in obj.values():
                if isinstance(value, (dict, list)):
                    find_names(value)
        elif isinstance(obj, list):
            for item in obj:
                find_names(item)

    find_names(match_data)

    return home_name, away_name

def prepare_signals(matches: list) -> list:
    """Обогащает сигналы извлечёнными названиями команд."""
    for idx, s in enumerate(matches):
        try:
            match_data = json.loads(s['match_data']) if s['match_data'] else {}
        except (json.JSONDecodeError, TypeError):
            match_data = {}

        # Логируем структуру первого сигнала для отладки (можно убрать после настройки)
        if idx == 0 and match_data:
            logger.info(f"DEBUG: sample match_data structure: {json.dumps(match_data, ensure_ascii=False)[:500]}")

        home_name, away_name = extract_team_names(match_data)
        s['home_name'] = home_name
        s['away_name'] = away_name

    return matches

# ---------- Основные маршруты ----------

@router.get("/")
async def index(request: Request):
    try:
        chat_id_raw = request.query_params.get("chat_id")
        chat_id = clean_chat_id(chat_id_raw)
        user_id = db.get_user_id(chat_id)
        if not user_id:
            user_id = db.create_user(chat_id)
        all_filters = db.get_all_filters(user_id)
        template = env.get_template("index.html")
        html = template.render(filters=all_filters, chat_id=chat_id)
        return HTMLResponse(content=html)
    except Exception as e:
        logger.error(f"Error in index: {e}", exc_info=True)
        return HTMLResponse(f"<h1>Error</h1><p>{e}</p>", status_code=500)

@router.get("/filter/new")
async def new_filter(request: Request):
    try:
        chat_id_raw = request.query_params.get("chat_id")
        chat_id = clean_chat_id(chat_id_raw)
        template = env.get_template("filter_form.html")
        html = template.render(chat_id=chat_id, filter=None)
        return HTMLResponse(content=html)
    except Exception as e:
        logger.error(f"Error in new_filter: {e}", exc_info=True)
        return HTMLResponse(f"<h1>Error</h1><p>{e}</p>", status_code=500)

@router.post("/filter/save")
async def save_filter(
    request: Request,
    chat_id: int = Form(...),
    match_time_min: int = Form(...), match_time_max: int = Form(...),
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
    glicko_home_min: float = Form(...), glicko_home_max: float = Form(...),
    glicko_away_min: float = Form(...), glicko_away_max: float = Form(...),
    glicko_draw_min: float = Form(...), glicko_draw_max: float = Form(...),
    expected_outcome: str = Form(...),
    rules: str = Form(...),
    rule_logic: str = Form(...),
    track_odds: bool = Form(...),
    odds_target: str = Form(...),
    odds_change_threshold: float = Form(...),
    odds_change_type: str = Form(...),
    odds_direction: str = Form(...)
):
    try:
        user_id = db.get_user_id(chat_id)
        if not user_id:
            user_id = db.create_user(chat_id)
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
            'glicko_home_min': glicko_home_min, 'glicko_home_max': glicko_home_max,
            'glicko_away_min': glicko_away_min, 'glicko_away_max': glicko_away_max,
            'glicko_draw_min': glicko_draw_min, 'glicko_draw_max': glicko_draw_max,
            'expected_outcome': expected_outcome,
            'rules': rules,
            'rule_logic': rule_logic,
            'track_odds': 1 if track_odds else 0,
            'odds_target': odds_target,
            'odds_change_threshold': odds_change_threshold,
            'odds_change_type': odds_change_type,
            'odds_direction': odds_direction
        }
        db.save_filter(user_id, data)
        return RedirectResponse(f"/?chat_id={chat_id}", status_code=303)
    except Exception as e:
        logger.error(f"Error saving filter: {e}", exc_info=True)
        return HTMLResponse(f"<h1>Error</h1><p>{e}</p>", status_code=500)

@router.get("/filter/edit/{filter_id}")
async def edit_filter(request: Request, filter_id: int):
    try:
        chat_id_raw = request.query_params.get("chat_id")
        chat_id = clean_chat_id(chat_id_raw)
        filter_data = db.get_filter(filter_id)
        if not filter_data:
            return HTMLResponse("Фильтр не найден", status_code=404)
        user_id = db.get_user_id(chat_id)
        if filter_data.get('user_id') != user_id:
            return HTMLResponse("Доступ запрещён", status_code=403)
        template = env.get_template("edit_filter.html")
        html = template.render(filter=filter_data, chat_id=chat_id)
        return HTMLResponse(content=html)
    except Exception as e:
        logger.error(f"Error in edit_filter: {e}", exc_info=True)
        return HTMLResponse(f"<h1>Error</h1><p>{e}</p>", status_code=500)

@router.post("/filter/update/{filter_id}")
async def update_filter(
    request: Request,
    filter_id: int,
    chat_id: int = Form(...),
    match_time_min: int = Form(...), match_time_max: int = Form(...),
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
    glicko_home_min: float = Form(...), glicko_home_max: float = Form(...),
    glicko_away_min: float = Form(...), glicko_away_max: float = Form(...),
    glicko_draw_min: float = Form(...), glicko_draw_max: float = Form(...),
    expected_outcome: str = Form(...),
    rules: str = Form(...),
    rule_logic: str = Form(...),
    track_odds: bool = Form(...),
    odds_target: str = Form(...),
    odds_change_threshold: float = Form(...),
    odds_change_type: str = Form(...),
    odds_direction: str = Form(...)
):
    try:
        user_id = db.get_user_id(chat_id)
        if not user_id:
            user_id = db.create_user(chat_id)
        filter_data = db.get_filter(filter_id)
        if not filter_data or filter_data.get('user_id') != user_id:
            return HTMLResponse("Доступ запрещён", status_code=403)
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
            'glicko_home_min': glicko_home_min, 'glicko_home_max': glicko_home_max,
            'glicko_away_min': glicko_away_min, 'glicko_away_max': glicko_away_max,
            'glicko_draw_min': glicko_draw_min, 'glicko_draw_max': glicko_draw_max,
            'expected_outcome': expected_outcome,
            'rules': rules,
            'rule_logic': rule_logic,
            'track_odds': 1 if track_odds else 0,
            'odds_target': odds_target,
            'odds_change_threshold': odds_change_threshold,
            'odds_change_type': odds_change_type,
            'odds_direction': odds_direction
        }
        db.update_filter(filter_id, data)
        return RedirectResponse(f"/?chat_id={chat_id}", status_code=303)
    except Exception as e:
        logger.error(f"Error updating filter: {e}", exc_info=True)
        return HTMLResponse(f"<h1>Error</h1><p>{e}</p>", status_code=500)

@router.get("/filter/delete/{filter_id}")
async def delete_filter(request: Request, filter_id: int):
    try:
        chat_id_raw = request.query_params.get("chat_id")
        chat_id = clean_chat_id(chat_id_raw)
        user_id = db.get_user_id(chat_id)
        if not user_id:
            return HTMLResponse("Пользователь не найден", status_code=404)
        filter_data = db.get_filter(filter_id)
        if not filter_data or filter_data.get('user_id') != user_id:
            return HTMLResponse("Доступ запрещён", status_code=403)
        db.delete_filter(filter_id)
        return RedirectResponse(f"/?chat_id={chat_id}", status_code=303)
    except Exception as e:
        logger.error(f"Error deleting filter: {e}", exc_info=True)
        return HTMLResponse(f"<h1>Error</h1><p>{e}</p>", status_code=500)

@router.get("/filter/toggle/{filter_id}")
async def toggle_filter(request: Request, filter_id: int):
    try:
        chat_id_raw = request.query_params.get("chat_id")
        chat_id = clean_chat_id(chat_id_raw)
        user_id = db.get_user_id(chat_id)
        if not user_id:
            return HTMLResponse("Пользователь не найден", status_code=404)
        filter_data = db.get_filter(filter_id)
        if not filter_data or filter_data.get('user_id') != user_id:
            return HTMLResponse("Доступ запрещён", status_code=403)
        new_status = not filter_data.get('is_active', False)
        db.update_filter(filter_id, {'is_active': 1 if new_status else 0})
        return RedirectResponse(f"/?chat_id={chat_id}", status_code=303)
    except Exception as e:
        logger.error(f"Error toggling filter: {e}", exc_info=True)
        return HTMLResponse(f"<h1>Error</h1><p>{e}</p>", status_code=500)

@router.get("/filter/stats/{filter_id}")
async def filter_stats(request: Request, filter_id: int):
    try:
        chat_id_raw = request.query_params.get("chat_id")
        chat_id = clean_chat_id(chat_id_raw)
        user_id = db.get_user_id(chat_id)
        if not user_id:
            return HTMLResponse("Пользователь не найден", status_code=404)
        filter_data = db.get_filter(filter_id)
        if not filter_data or filter_data.get('user_id') != user_id:
            return HTMLResponse("Доступ запрещён", status_code=403)
        stats = db.get_filter_stats(filter_id)
        recent = db.get_recent_triggered_for_filter(filter_id)
        template = env.get_template("filter_stats.html")
        html = template.render(filter=filter_data, stats=stats, recent=recent, chat_id=chat_id)
        return HTMLResponse(content=html)
    except Exception as e:
        logger.error(f"Error in stats: {e}", exc_info=True)
        return HTMLResponse(f"<h1>Error</h1><p>{e}</p>", status_code=500)

@router.get("/archive")
async def archive(request: Request):
    try:
        chat_id_raw = request.query_params.get("chat_id")
        chat_id = clean_chat_id(chat_id_raw)
        user_id = db.get_user_id(chat_id)
        if not user_id:
            user_id = db.create_user(chat_id)

        filter_id = request.query_params.get("filter_id")
        if filter_id:
            filter_id = int(filter_id)
        match_text = request.query_params.get("match_text")
        from_date = request.query_params.get("from_date")
        to_date = request.query_params.get("to_date")
        page = int(request.query_params.get("page", 1))
        limit = 20
        offset = (page - 1) * limit

        filters = db.get_user_filters_for_archive(user_id)
        total = db.get_triggered_matches_count(user_id, filter_id, match_text, from_date, to_date)
        matches = db.get_triggered_matches(user_id, filter_id, match_text, from_date, to_date, limit, offset)

        matches = prepare_signals(matches)

        total_pages = (total + limit - 1) // limit if total > 0 else 1

        template = env.get_template("archive.html")
        html = template.render(
            chat_id=chat_id,
            signals=matches,
            total=total,
            page=page,
            total_pages=total_pages,
            filters=filters,
            selected_filter=filter_id,
            match_text=match_text or '',
            from_date=from_date or '',
            to_date=to_date or ''
        )
        return HTMLResponse(content=html)
    except Exception as e:
        logger.error(f"Error in archive: {e}", exc_info=True)
        return HTMLResponse(f"<h1>Error</h1><p>{e}</p>", status_code=500)

@router.get("/signals")
async def signals_table(request: Request):
    try:
        chat_id_raw = request.query_params.get("chat_id")
        chat_id = clean_chat_id(chat_id_raw)
        user_id = db.get_user_id(chat_id)
        if not user_id:
            user_id = db.create_user(chat_id)

        filter_id = request.query_params.get("filter_id")
        if filter_id:
            filter_id = int(filter_id)
        match_text = request.query_params.get("match_text")
        from_date = request.query_params.get("from_date")
        to_date = request.query_params.get("to_date")
        page = int(request.query_params.get("page", 1))
        limit = 20
        offset = (page - 1) * limit

        filters = db.get_user_filters_for_archive(user_id)
        total = db.get_triggered_matches_count(user_id, filter_id, match_text, from_date, to_date)
        matches = db.get_triggered_matches(user_id, filter_id, match_text, from_date, to_date, limit, offset)

        matches = prepare_signals(matches)

        total_pages = (total + limit - 1) // limit if total > 0 else 1

        template = env.get_template("_signals_table.html")
        html = template.render(
            chat_id=chat_id,
            signals=matches,
            total=total,
            page=page,
            total_pages=total_pages,
            filters=filters,
            selected_filter=filter_id,
            match_text=match_text or '',
            from_date=from_date or '',
            to_date=to_date or ''
        )
        return HTMLResponse(content=html)
    except Exception as e:
        logger.error(f"Error in signals table: {e}", exc_info=True)
        return HTMLResponse(f"<p class='text-danger'>Ошибка загрузки сигналов: {e}</p>", status_code=500)

@router.get("/leagues")
async def leagues_page(request: Request):
    try:
        chat_id_raw = request.query_params.get("chat_id")
        chat_id = clean_chat_id(chat_id_raw)
        user_id = db.get_user_id(chat_id)
        if not user_id:
            user_id = db.create_user(chat_id)
        client = SStatsClient()
        all_leagues = client.get_leagues()
        if not isinstance(all_leagues, list):
            all_leagues = []
        blacklisted = db.get_blacklisted_leagues_full(user_id)
        blacklist_ids = [b['id'] for b in blacklisted]
        template = env.get_template("leagues.html")
        html = template.render(all_leagues=all_leagues, blacklisted_ids=blacklist_ids, chat_id=chat_id)
        return HTMLResponse(content=html)
    except Exception as e:
        logger.error(f"Error in leagues: {e}", exc_info=True)
        return HTMLResponse(f"<h1>Error</h1><p>{e}</p>", status_code=500)

@router.post("/blacklist/add")
async def add_blacklist(request: Request, chat_id: int = Form(...), league_id: int = Form(...), league_name: str = Form(...)):
    try:
        user_id = db.get_user_id(chat_id)
        if user_id:
            db.add_blacklisted_league(user_id, league_id, league_name)
        return RedirectResponse(f"/leagues?chat_id={chat_id}", status_code=303)
    except Exception as e:
        logger.error(f"Error adding blacklist: {e}", exc_info=True)
        return HTMLResponse(f"<h1>Error</h1><p>{e}</p>", status_code=500)

@router.post("/blacklist/remove")
async def remove_blacklist(request: Request, chat_id: int = Form(...), league_id: int = Form(...)):
    try:
        user_id = db.get_user_id(chat_id)
        if user_id:
            db.remove_blacklisted_league(user_id, league_id)
        return RedirectResponse(f"/leagues?chat_id={chat_id}", status_code=303)
    except Exception as e:
        logger.error(f"Error removing blacklist: {e}", exc_info=True)
        return HTMLResponse(f"<h1>Error</h1><p>{e}</p>", status_code=500)

# --- НОВЫЙ МАРШРУТ: Очистка архива ---
@router.post("/archive/clear")
async def clear_archive(request: Request, chat_id: int = Form(...)):
    try:
        user_id = db.get_user_id(chat_id)
        if not user_id:
            return HTMLResponse("Пользователь не найден", status_code=404)
        db.delete_all_triggered_matches(user_id)
        return RedirectResponse(f"/archive?chat_id={chat_id}", status_code=303)
    except Exception as e:
        logger.error(f"Error clearing archive: {e}", exc_info=True)
        return HTMLResponse(f"<h1>Ошибка</h1><p>{e}</p>", status_code=500)