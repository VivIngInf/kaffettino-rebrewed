import os
import shutil

# Import the import statement (lmao) from the SCons context 
from SCons.Script import Import

Import('env')  # Import the enviroment object

# Define the input and output data directory for SPIFFS
source_dir = "./data"  # directory containing the website
target_dir = os.path.join(env.subst("$BUILD_DIR"), "spiffs")  # SPIFFS directory inside the esp32

def copy_files_to_spiffs(source_dir, target_dir):
    if not os.path.isdir(source_dir):
        raise Exception(f"Source directory {source_dir} does not exist.")
    
    # Delete target directory if already existing
    if os.path.isdir(target_dir):
        shutil.rmtree(target_dir)
    
    # Create target directory (SPIFF)
    os.makedirs(target_dir)

    # Copy file from source to target
    for item in os.listdir(source_dir):
        s = os.path.join(source_dir, item)
        d = os.path.join(target_dir, item)
        if os.path.isdir(s):
            shutil.copytree(s, d, dirs_exist_ok=True)
        else:
            shutil.copy2(s, d)

copy_files_to_spiffs(source_dir, target_dir)

# Define command for SPIFFS copy
env.AddCustomTarget(
    "upload-spiffs",  # name of the custom target
    None,  # No dependency
    [
        "python -m platformio.serialupload --upload-port ${env.subst('$UPLOAD_PORT')} --target spiffs"
    ]
)

# Print message to confirm everything went successfull
print("SPIFFS files copied successfully.")
