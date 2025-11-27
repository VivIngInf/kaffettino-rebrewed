# upload-spiffs.py
Import('env')

env.AddCustomTarget(
    "upload-spiffs",
    None,
    [
        "python -m platformio.serialupload --upload-port ${env.subst('$UPLOAD_PORT')} --target spiffs"
    ]
)
