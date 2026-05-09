from sqlalchemy import or_


def apply_text_search(query, model, search: str | None, fields: list[str]):
    if not search:
        return query
    normalized = search.strip()
    if not normalized:
        return query
    conditions = [getattr(model, field).ilike(f"%{normalized}%") for field in fields if hasattr(model, field)]
    if conditions:
        query = query.where(or_(*conditions))
    return query


def paginate_query(query, page: int, limit: int):
    page = max(page, 1)
    limit = min(max(limit, 1), 100)
    offset = (page - 1) * limit
    return query.offset(offset).limit(limit), {"page": page, "limit": limit}
