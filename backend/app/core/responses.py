from fastapi.responses import JSONResponse


def success_response(message: str, data=None, status_code: int = 200, meta=None):
    payload = {"success": True, "message": message, "data": data}
    if meta is not None:
        payload["meta"] = meta
    return JSONResponse(status_code=status_code, content=payload)


def error_response(message: str, status_code: int = 400, data=None):
    return JSONResponse(
        status_code=status_code,
        content={"success": False, "message": message, "data": data},
    )
