# Made by Davemane42

class MultiAreaConditioning:
    def __init__(self) -> None:
        pass

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "conditioning1": ("CONDITIONING", ),
                "conditioning2": ("CONDITIONING", ),
                "conditioning3": ("CONDITIONING", ),
                "conditioning4": ("CONDITIONING", ),
                "conditioning5": ("CONDITIONING", ),
                "conditioning6": ("CONDITIONING", ),
                "conditioning7": ("CONDITIONING", ),
                "conditioning8": ("CONDITIONING", ),
            },
            "hidden": {"extra_pnginfo": "EXTRA_PNGINFO"},
        }

    RETURN_TYPES = ("CONDITIONING", )
    FUNCTION = "doStuff"
    CATEGORY = "Dave"

    def doStuff(self, conditioning1, conditioning2, conditioning3, conditioning4, conditioning5, conditioning6, conditioning7, conditioning8, extra_pnginfo=None):

        c = []
        clist = [conditioning1, conditioning2, conditioning3, conditioning4, conditioning5, conditioning6, conditioning7, conditioning8]
        values = []

        # Really jank, only work if 1 node exist
        # cant find the node unique_id in python
        if extra_pnginfo:
            for node in extra_pnginfo["workflow"]["nodes"]:
                if node["type"] == "MultiAreaConditioning":
                    values = node["properties"]["values"]
                    
        for k, conditioning in enumerate(clist):
            if values[k][2] == 0 or values[k][3] == 0: continue;
            for t in conditioning:
                n = [t[0], t[1].copy()]
                n[1]['area'] = (values[k][3] // 8, values[k][2] // 8, values[k][1] // 8, values[k][0] // 8)
                n[1]['strength'] = 1.0
                n[1]['min_sigma'] = 0.0
                n[1]['max_sigma'] = 99.0
                
                c.append(n)
        
        return (c, )

class ConditioningUpscale():
    def __init__(self) -> None:
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "conditioning": ("CONDITIONING", ),
                "scalar": ("INT", {"default": 2, "min": 1, "max": 100}),
            }
        }
    
    RETURN_TYPES = ("CONDITIONING",)
    CATEGORY = "Dave"

    FUNCTION = 'upscale'

    def upscale(self, conditioning, scalar):
        
        c = []
        for t in conditioning:

            n = [t[0], t[1].copy()]
            if 'area' in n[1]:
                
                n[1]['area'] = tuple(map(lambda x: x*scalar, n[1]['area']))

            c.append(n)

        return (c, )

class ConditioningDebug():
    def __init__(self) -> None:
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "conditioning": ("CONDITIONING", ),
            }
        }
    
    RETURN_TYPES = ()
    FUNCTION = "debug"

    OUTPUT_NODE = True

    CATEGORY = "Dave"

    def debug(self, conditioning):
        print("\nDebug")
        for i, t in enumerate(conditioning):
            print(f"{i}:")
            if "area" in t[1]:
                print(f"\tx{t[1]['area'][3]*8} y{t[1]['area'][2]*8} \n\tw{t[1]['area'][1]*8} h{t[1]['area'][0]*8} \n\tstrength: {t[1]['strength']}")
            else:
                print(f"\tFullscreen")

        return (None, )
            
NODE_CLASS_MAPPINGS = {
    "MultiAreaConditioning": MultiAreaConditioning,
    "ConditioningUpscale": ConditioningUpscale,
    #"ConditioningDebug": ConditioningDebug,
}