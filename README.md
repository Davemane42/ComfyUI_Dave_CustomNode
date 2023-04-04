# Davemane42's Custom Node for [ComfyUI](https://github.com/comfyanonymous/ComfyUI)  

## Instalation:

- Navigate to the `/ComfyUI/custom_nodes/` folder
- `git clone git clone https://github.com/Davemane42/ComfyUI_Dave_CustomNode`
- Start ComfyUI
  - all require file should be downloaded/copied from there.
  - no need to manually copy/paste .js files anymore

___
# MultiAreaConditioning 2.4  

Let you visualize the ConditioningSetArea node for better control  
<details close="close">
    <summary>Right click menu to add/remove/swap layers:</summary>
    <img src="./images/RightClickMenu.png">
</details>
Display what node is associated with current input selected  

<img src="./images/MultiAreaConditioning_node.png" width="500px">

this also come with a <strong>ConditioningUpscale</strong> node.  
useseful for hires fix workflow

<img src="./images/ConditioningUpscale_node.png" width="500px">
<details close="close">
    <summary>Result example:</summary>
    <img src="./images/MultiAreaConditioning_result.png" width="500px">
</details>
<details close="close">
    <summary>Workflow example:</summary>
    <img src="./images/MultiAreaConditioning_workflow.svg" width="100%">
</details>
  
___
# MultiLatentComposite 1.1  

Let you visualize the MultiLatentComposite node for better control  
<details close="close">
    <summary>Right click menu to add/remove/swap layers:</summary>
    <img src="./images/RightClickMenu.png">
</details>
Display what node is associated with current input selected  

<img src="./images/MultiLatentComposite_node.png" width="500px">

<details close="close">
    <summary>Result example:</summary>
    <img src="./images/MultiLatentComposite_result.png" width="500px">
</details>
<details close="close">
    <summary>Workflow example:</summary>
    <img src="./images/MultiLatentComposite_workflow.svg" width="100%">
</details>

___
# Known issues

## MultiAreaComposition 2.4
- 
## MultiLatentComposite 1.1
- no check for out of bound layers