# Made by Davemane42#0042 for ComfyUI
import os
import subprocess
import importlib.util
import sys
import filecmp
import shutil

import __main__

python = sys.executable


extentions_folder = os.path.join(os.path.dirname(os.path.realpath(__main__.__file__)),
                                 "web" + os.sep + "extensions" + os.sep + "Davemane42")
javascript_folder = os.path.join(os.path.dirname(os.path.realpath(__file__)), "javascript")

if not os.path.exists(extentions_folder):
    print('Making the "web\extensions\Davemane42" folder')
    os.mkdir(extentions_folder)

result = filecmp.dircmp(javascript_folder, extentions_folder)

if result.left_only or result.diff_files:
    print('Update to javascripts files detected')
    file_list = list(result.left_only)
    file_list.extend(x for x in result.diff_files if x not in file_list)

    for file in file_list:
        print(f'Copying {file} to extensions folder')
        src_file = os.path.join(javascript_folder, file)
        dst_file = os.path.join(extentions_folder, file)
        if os.path.exists(dst_file):
            os.remove(dst_file)
        #print("disabled")
        shutil.copy(src_file, dst_file)


def is_installed(package, package_overwrite=None):
    try:
        spec = importlib.util.find_spec(package)
    except ModuleNotFoundError:
        pass

    package = package_overwrite or package

    if spec is None:
        print(f"Installing {package}...")
        command = f'"{python}" -m pip install {package}'
  
        result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True, env=os.environ)

        if result.returncode != 0:
            print(f"Couldn't install\nCommand: {command}\nError code: {result.returncode}")

# is_installed("huggingface_hub")
# is_installed("onnx")
# is_installed("onnxruntime", "onnxruntime-gpu")

from .MultiAreaConditioning import MultiAreaConditioning, ConditioningUpscale, ConditioningStretch, ConditioningDebug
from .MultiLatentComposite import MultiLatentComposite
#from .ABGRemover import ABGRemover

NODE_CLASS_MAPPINGS = {
    "MultiLatentComposite": MultiLatentComposite,
    "MultiAreaConditioning": MultiAreaConditioning,
    "ConditioningUpscale": ConditioningUpscale,
    "ConditioningStretch": ConditioningStretch,
    #"ABGRemover": ABGRemover,
}

print('\033[34mDavemane42 Custom Nodes: \033[92mLoaded\033[0m')