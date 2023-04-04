import { app } from "/scripts/app.js";
import {CUSTOM_INT, recursiveLinkUpstream, transformFunc, swapInputs, renameNodeInputs, removeNodeInputs, getDrawColor, computeCanvasSize} from "./utils.js"

function addMultiAreaConditioningCanvas(node, app) {

	const widget = {
		type: "customCanvas",
		name: "MultiAreaConditioning-Canvas",
		get value() {
			return this.canvas.value;
		},
		set value(x) {
			this.canvas.value = x;
		},
		draw: function (ctx, node, widgetWidth, widgetY) {
			
			// If we are initially offscreen when created we wont have received a resize event
			// Calculate it here instead
			if (!node.canvasHeight) {
				computeCanvasSize(node, node.size)
			}

			const visible = true //app.canvasblank.ds.scale > 0.5 && this.type === "customCanvas";
			const t = ctx.getTransform();
			const margin = 10
			const border = 2

			const widgetHeight = node.canvasHeight
            const values = node.properties["values"]
			const width = Math.round(node.properties["width"])
			const height = Math.round(node.properties["height"])

			const scale = Math.min((widgetWidth-margin*2)/width, (widgetHeight-margin*2)/height)

			const index = Math.round(node.widgets[node.index].value)

			Object.assign(this.canvas.style, {
				left: `${t.e}px`,
				top: `${t.f + (widgetY*t.d)}px`,
				width: `${widgetWidth * t.a}px`,
				height: `${widgetHeight * t.d}px`,
				position: "absolute",
				zIndex: 1,
				fontSize: `${t.d * 10.0}px`,
				pointerEvents: "none",
			});

			this.canvas.hidden = !visible;

            let backgroudWidth = width * scale
            let backgroundHeight = height * scale

			let xOffset = margin
			if (backgroudWidth < widgetWidth) {
				xOffset += (widgetWidth-backgroudWidth)/2 - margin
			}
			let yOffset = margin
			if (backgroundHeight < widgetHeight) {
				yOffset += (widgetHeight-backgroundHeight)/2 - margin
			}

			let widgetX = xOffset
			widgetY = widgetY + yOffset

			ctx.fillStyle = "#000000"
			ctx.fillRect(widgetX-border, widgetY-border, backgroudWidth+border*2, backgroundHeight+border*2)

			ctx.fillStyle = globalThis.LiteGraph.NODE_DEFAULT_BGCOLOR
			ctx.fillRect(widgetX, widgetY, backgroudWidth, backgroundHeight);

			function getDrawArea(v) {
				let x = v[0]*backgroudWidth/width
				let y = v[1]*backgroundHeight/height
				let w = v[2]*backgroudWidth/width
				let h = v[3]*backgroundHeight/height

				if (x > backgroudWidth) { x = backgroudWidth}
				if (y > backgroundHeight) { y = backgroundHeight}

				if (x+w > backgroudWidth) {
					w = Math.max(0, backgroudWidth-x)
				}
				
				if (y+h > backgroundHeight) {
					h = Math.max(0, backgroundHeight-y)
				}

				return [x, y, w, h]
			}
            
			// Draw all the conditioning zones
			for (const [k, v] of values.entries()) {

				if (k == index) {continue}

				const [x, y, w, h] = getDrawArea(v)

				ctx.fillStyle = getDrawColor(k/values.length, "80") //colors[k] + "B0"
				ctx.fillRect(widgetX+x, widgetY+y, w, h)

			}

			ctx.beginPath();
			ctx.lineWidth = 1;

			for (let x = 0; x <= width/64; x += 1) {
				ctx.moveTo(widgetX+x*64*scale, widgetY);
				ctx.lineTo(widgetX+x*64*scale, widgetY+backgroundHeight);
			}

			for (let y = 0; y <= height/64; y += 1) {
				ctx.moveTo(widgetX, widgetY+y*64*scale);
				ctx.lineTo(widgetX+backgroudWidth, widgetY+y*64*scale);
			}

			ctx.strokeStyle = "#00000050";
			ctx.stroke();
			ctx.closePath();

			// Draw currently selected zone
			console.log(index)
			let [x, y, w, h] = getDrawArea(values[index])

			w = Math.max(32*scale, w)
			h = Math.max(32*scale, h)

			//ctx.fillStyle = "#"+(Number(`0x1${colors[index].substring(1)}`) ^ 0xFFFFFF).toString(16).substring(1).toUpperCase()
			ctx.fillStyle = "#ffffff"
			ctx.fillRect(widgetX+x, widgetY+y, w, h)

			const selectedColor = getDrawColor(index/values.length, "FF")
			ctx.fillStyle = selectedColor
			ctx.fillRect(widgetX+x+border, widgetY+y+border, w-border*2, h-border*2)

			// Display
			ctx.beginPath();

			ctx.arc(LiteGraph.NODE_SLOT_HEIGHT*0.5, LiteGraph.NODE_SLOT_HEIGHT*(index + 0.5)+4, 4, 0, Math.PI * 2);
			ctx.fill();

			ctx.lineWidth = 1;
			ctx.strokeStyle = "white";
			ctx.stroke();

			if (node.selected) {
				const connectedNodes = recursiveLinkUpstream(node, node.inputs[index].type, 0, index)
				
				if (connectedNodes.length !== 0) {
					for (let [node_ID, depth] of connectedNodes) {
						let connectedNode = node.graph._nodes_by_id[node_ID]
						if (connectedNode.type != node.type) {
							const [x, y] = connectedNode.pos
							const [w, h] = connectedNode.size
							const offset = 5
							const titleHeight = LiteGraph.NODE_TITLE_HEIGHT * (connectedNode.type === "Reroute"  ? 0 : 1)

							ctx.strokeStyle = selectedColor
							ctx.lineWidth = 5;
							ctx.strokeRect(x-offset-node.pos[0], y-offset-node.pos[1]-titleHeight, w+offset*2, h+offset*2+titleHeight)
						}
					}
				}
			}
			ctx.lineWidth = 1;
			ctx.closePath();

		},
	};

	widget.canvas = document.createElement("canvas");
	widget.canvas.className = "dave-custom-canvas";

	widget.parent = node;
	document.body.appendChild(widget.canvas);

	node.addCustomWidget(widget);

	app.canvas.onDrawBackground = function () {
		// Draw node isnt fired once the node is off the screen
		// if it goes off screen quickly, the input may not be removed
		// this shifts it off screen so it can be moved back if the node is visible.
		for (let n in app.graph._nodes) {
			n = graph._nodes[n];
			for (let w in n.widgets) {
				let wid = n.widgets[w];
				if (Object.hasOwn(wid, "canvas")) {
					wid.canvas.style.left = -8000 + "px";
					wid.canvas.style.position = "absolute";
				}
			}
		}
	};

	node.onResize = function (size) {
		computeCanvasSize(node, size);
	}

	return { minWidth: 200, minHeight: 200, widget }
}

app.registerExtension({
	name: "Comfy.Davemane42.MultiAreaConditioning",
	async beforeRegisterNodeDef(nodeType, nodeData, app) {
		if (nodeData.name === "MultiAreaConditioning") {
			const onNodeCreated = nodeType.prototype.onNodeCreated;
			nodeType.prototype.onNodeCreated = function () {
				const r = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;

				this.setProperty("width", 512)
				this.setProperty("height", 512)
				this.setProperty("values", [[0, 0, 0, 0, 1.0], [0, 0, 0, 0, 1.0]])

				this.selected = false
				this.index = 3

                this.serialize_widgets = true;

				CUSTOM_INT(this, "resolutionX", 512, function (v, _, node) {const s = this.options.step / 10; this.value = Math.round(v / s) * s; node.properties["width"] = this.value})
				CUSTOM_INT(this, "resolutionY", 512, function (v, _, node) {const s = this.options.step / 10; this.value = Math.round(v / s) * s; node.properties["height"] = this.value})
                
				addMultiAreaConditioningCanvas(this, app)

				CUSTOM_INT(
					this,
					"index",
					0,
					function (v, _, node) {

						let values = node.properties["values"]

						node.widgets[4].value = values[v][0]
						node.widgets[5].value = values[v][1]
						node.widgets[6].value = values[v][2]
						node.widgets[7].value = values[v][3]
						if (!values[v][4]) {values[v][4] = 1.0}
						node.widgets[8].value = values[v][4]
					},
					{ step: 10, max: 1 }

				)
				
				CUSTOM_INT(this, "x", 0, function (v, _, node) {transformFunc(this, v, node, 0)})
				CUSTOM_INT(this, "y", 0, function (v, _, node) {transformFunc(this, v, node, 1)})
				CUSTOM_INT(this, "width", 0, function (v, _, node) {transformFunc(this, v, node, 2)})
				CUSTOM_INT(this, "height", 0, function (v, _, node) {transformFunc(this, v, node, 3)})
				CUSTOM_INT(this, "strength", 1, function (v, _, node) {transformFunc(this, v, node, 4)}, {"min": 0.0, "max": 10.0, "step": 0.1, "precision": 2})

				this.getExtraMenuOptions = function(_, options) {
					options.unshift(
						{
							content: `insert input above ${this.widgets[this.index].value} /\\`,
							callback: () => {
								this.addInput("conditioning", "CONDITIONING")
								
								const inputLenth = this.inputs.length-1
								const index = this.widgets[this.index].value

								for (let i = inputLenth; i > index; i--) {
									swapInputs(this, i, i-1)
								}
								renameNodeInputs(this, "conditioning")

								this.properties["values"].splice(index, 0, [0, 0, 0, 0, 1])
								this.widgets[this.index].options.max = inputLenth

								this.setDirtyCanvas(true);

							},
						},
						{
							content: `insert input below ${this.widgets[this.index].value} \\/`,
							callback: () => {
								this.addInput("conditioning", "CONDITIONING")
								
								const inputLenth = this.inputs.length-1
								const index = this.widgets[this.index].value

								for (let i = inputLenth; i > index+1; i--) {
									swapInputs(this, i, i-1)
								}
								renameNodeInputs(this, "conditioning")

								this.properties["values"].splice(index+1, 0, [0, 0, 0, 0, 1])
								this.widgets[this.index].options.max = inputLenth

								this.setDirtyCanvas(true);
							},
						},
						{
							content: `swap with input above ${this.widgets[this.index].value} /\\`,
							callback: () => {
								const index = this.widgets[this.index].value
								if (index !== 0) {
									swapInputs(this, index, index-1)

									renameNodeInputs(this, "conditioning")

									this.properties["values"].splice(index-1,0,this.properties["values"].splice(index,1)[0]);
									this.widgets[this.index].value = index-1

									this.setDirtyCanvas(true);
								}
							},
						},
						{
							content: `swap with input below ${this.widgets[this.index].value} \\/`,
							callback: () => {
								const index = this.widgets[this.index].value
								if (index !== this.inputs.length-1) {
									swapInputs(this, index, index+1)

									renameNodeInputs(this, "conditioning")
									
									this.properties["values"].splice(index+1,0,this.properties["values"].splice(index,1)[0]);
									this.widgets[this.index].value = index+1

									this.setDirtyCanvas(true);
								}
							},
						},
						{
							content: `remove currently selected input ${this.widgets[this.index].value}`,
							callback: () => {
								const index = this.widgets[this.index].value
								removeNodeInputs(this, [index])
								renameNodeInputs(this, "conditioning")
							},
						},
						{
							content: "remove all unconnected inputs",
							callback: () => {
								let indexesToRemove = []

								for (let i = 0; i < this.inputs.length; i++) {
									if (!this.inputs[i].link) {
										indexesToRemove.push(i)
									}
								}

								if (indexesToRemove.length) {
									removeNodeInputs(this, indexesToRemove, "conditioning")
								}
								renameNodeInputs(this, "conditioning")
							},
						},
					);
				}

				this.onRemoved = function () {
					// When removing this node we need to remove the input from the DOM
					for (let y in this.widgets) {
						if (this.widgets[y].canvas) {
							this.widgets[y].canvas.remove();
						}
					}
				};
			
				this.onSelected = function () {
					this.selected = true
				}
				this.onDeselected = function () {
					this.selected = false
				}

				return r;
			};
		}
	},
	loadedGraphNode(node, _) {
		if (node.type === "MultiAreaConditioning") {
			node.widgets[node.index].options["max"] = node.properties["values"].length-1
		}
	},
	
});