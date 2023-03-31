# Davemane42's Custom Node for [ComfyUI](https://github.com/comfyanonymous/ComfyUI)  

# MultiAreaConditioning 2.2  

## Installation:  
### require ComfyUI updated after 28th March 2023  

[MultiAreaConditioning.js](MultiAreaConditioning/MultiAreaConditioning.js) -> ComfyUI\web\extensions  
[MultiAreaConditioning.py](MultiAreaConditioning/MultiAreaConditioning.py) -> ComfyUI\custom_nodes  

no way of doing it automaticly as of 30/03/23 (working on it)  
#

Let you visualize the ConditioningSetArea node for better control  
Right click on the node to add/remove inputs  
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
