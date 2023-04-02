# Made by Davemane42#0042 for ComfyUI

from .MultiAreaConditioning import MultiAreaConditioning, ConditioningUpscale, ConditioningStretch, ConditioningDebug
from .MultiLatentComposite import MultiLatentComposite

NODE_CLASS_MAPPINGS = {
    "MultiLatentComposite": MultiLatentComposite,
    "MultiAreaConditioning": MultiAreaConditioning,
    "ConditioningUpscale": ConditioningUpscale,
    "ConditioningStretch": ConditioningStretch,
    #"ConditioningDebug": ConditioningDebug,
}