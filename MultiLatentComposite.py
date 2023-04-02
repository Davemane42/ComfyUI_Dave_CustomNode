import torch

class MultiLatentComposite:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "samples_to": ("LATENT",),
                "samples_from0": ("LATENT",),
            },
            "hidden": {"extra_pnginfo": "EXTRA_PNGINFO", "unique_id": "UNIQUE_ID"},
        }
    RETURN_TYPES = ("LATENT",)
    FUNCTION = "composite"

    CATEGORY = "Davemane42"

    def composite(self, samples_to, extra_pnginfo, unique_id, **kwargs):

        values = []

        for node in extra_pnginfo["workflow"]["nodes"]:
            if node["id"] == int(unique_id):
                values = node["properties"]["values"]
                break
        
        
        samples_out = samples_to.copy()
        s = samples_to["samples"].clone()
        samples_to = samples_to["samples"]

        k = 0
        for arg in kwargs:
            if k > len(values): break;

            x =  values[k][0] // 8
            y = values[k][1] // 8
            feather = values[k][2] // 8

            samples_from = kwargs[arg]["samples"]
            if feather == 0:
                s[:,:,y:y+samples_from.shape[2],x:x+samples_from.shape[3]] = samples_from[:,:,:samples_to.shape[2] - y, :samples_to.shape[3] - x]
            else:
                samples_from = samples_from[:,:,:samples_to.shape[2] - y, :samples_to.shape[3] - x]
                mask = torch.ones_like(samples_from)
                for t in range(feather):
                    if y != 0:
                        mask[:,:,t:1+t,:] *= ((1.0/feather) * (t + 1))

                    if y + samples_from.shape[2] < samples_to.shape[2]:
                        mask[:,:,mask.shape[2] -1 -t: mask.shape[2]-t,:] *= ((1.0/feather) * (t + 1))
                    if x != 0:
                        mask[:,:,:,t:1+t] *= ((1.0/feather) * (t + 1))
                    if x + samples_from.shape[3] < samples_to.shape[3]:
                        mask[:,:,:,mask.shape[3]- 1 - t: mask.shape[3]- t] *= ((1.0/feather) * (t + 1))
                rev_mask = torch.ones_like(mask) - mask
                s[:,:,y:y+samples_from.shape[2],x:x+samples_from.shape[3]] = samples_from[:,:,:samples_to.shape[2] - y, :samples_to.shape[3] - x] * mask + s[:,:,y:y+samples_from.shape[2],x:x+samples_from.shape[3]] * rev_mask
            k += 1

        samples_out["samples"] = s
        return (samples_out,)