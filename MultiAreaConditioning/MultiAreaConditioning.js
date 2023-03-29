import { app } from "../scripts/app.js";

function CUSTOM_INT(node, inputName, val, func, config = {}) {
	return {
		widget: node.addWidget(
			"number",
			inputName,
			val,
			func,
			Object.assign({}, { min: 0, max: 2048, step: 640, precision: 0 }, config)
		),
	};
}

function recursiveLinkUpstream(node, index=0) {
	const link = node.inputs[index].link
	if (link) {
		const nodeID = node.graph.links[link].origin_id
		const connectedNode = node.graph._nodes_by_id[nodeID]

		if (connectedNode.type === "Reroute") {
			return recursiveLinkUpstream(connectedNode)
		} else {
			return connectedNode
		}
	} else {
		return node
	}
}

function addCanvas(node, app) {

	function computeCanvasSize(node, size) {
		if (node.widgets[0].last_y == null) return;
	
		const MIN_SIZE = 200;
	
		let y = LiteGraph.NODE_WIDGET_HEIGHT * node.inputs.length + 5;
		let freeSpace = size[1] - y;
	
		// Compute the height of all non customtext widgets
		let widgetHeight = 0;
		for (let i = 0; i < node.widgets.length; i++) {
			const w = node.widgets[i];
			if (w.type !== "customCanvas") {
				if (w.computeSize) {
					widgetHeight += w.computeSize()[1] + 4;
				} else {
					widgetHeight += LiteGraph.NODE_WIDGET_HEIGHT + 5;
				}
			}
		}
	
		// See how large the canvas can be
		freeSpace -= widgetHeight;

		// There isnt enough space for all the widgets, increase the size of the node
		if (freeSpace < MIN_SIZE) {
			freeSpace = MIN_SIZE;
			node.size[1] = y + widgetHeight + freeSpace;
			node.graph.setDirtyCanvas(true);
		}
	
		// Position each of the widgets
		for (const w of node.widgets) {
			w.y = y;
			if (w.type === "customCanvas") {
				y += freeSpace;
			} else if (w.computeSize) {
				y += w.computeSize()[1] + 4;
			} else {
				y += LiteGraph.NODE_WIDGET_HEIGHT + 4;
			}
		}
	
		node.canvasHeight = freeSpace;
	}

	const widget = {
		type: "customCanvas",
		name: "name",
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
			const width = node.properties["width"]
			const height = node.properties["height"]

			const scale = Math.min((widgetWidth-margin*2)/width, (widgetHeight-margin*2)/height)

			const index = node.widgets[3].value

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

				if (x+w > backgroudWidth) {
					w = Math.max(0, backgroudWidth-x)
				}
				
				if (y+h > backgroundHeight) {
					h = Math.max(0, backgroundHeight-y)
				}

				return [x, y, w, h]
			}

			function getDrawColor(percent, alpha) {
				let h = 360*percent
				let s = 50;
				let l = 50;
				l /= 100;
				const a = s * Math.min(l, 1 - l) / 100;
				const f = n => {
					const k = (n + h / 30) % 12;
					const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
					return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
				};
				return `#${f(0)}${f(8)}${f(4)}${alpha}`;
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
				const connectedNode = recursiveLinkUpstream(node, index)
				if (connectedNode) {

					const [x, y] = connectedNode.pos
					const [w, h] = connectedNode.size
					const offset = 5

					ctx.strokeStyle = selectedColor
					ctx.lineWidth = 5;
					ctx.strokeRect(x-offset-node.pos[0], y-offset-node.pos[1]-LiteGraph.NODE_TITLE_HEIGHT, w+offset*2, h+offset*2+LiteGraph.NODE_TITLE_HEIGHT)
				}
			}
			ctx.lineWidth = 1;
			ctx.closePath();

		},
	};

	widget.canvas = document.createElement("canvas");
	widget.canvas.className = "dave-custom-canvas";

	// Mouse event... could be usefull
	// widget.canvas.addEventListener("click", function(e) {
	// 	console.log("click", e)
	// });
	// widget.canvas.addEventListener("mouseenter", function(e) {
	// 	console.log("mouseenter", e)
	// });
	// widget.canvas.addEventListener("mouseleave", function(e) {
	// 	console.log("mouseleave", e)
	// });

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


function transformFunc(widget, value, node, index) {
	const s = widget.options.step / 10;
	widget.value = Math.round(value / s) * s;
	node.properties["values"][node.widgets[3].value][index] = widget.value
	if (node.widgets_values) { 
		node.widgets_values[2] = node.properties["values"].join()
	}
}

app.registerExtension({
	name: "Comfy.MultiAreaConditioning",
	async beforeRegisterNodeDef(nodeType, nodeData, app) {
		if (nodeData.name === "MultiAreaConditioning") {
			const onNodeCreated = nodeType.prototype.onNodeCreated;
			nodeType.prototype.onNodeCreated = function () {
				const r = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;

				this.setProperty("width", 512)
				this.setProperty("height", 512)

				this.setProperty("values", [[0, 0, 0, 0]])

				this.selected = false

                this.serialize_widgets = true;

				CUSTOM_INT(this, "resolutionX", 512, function (v, _, node) {const s = this.options.step / 10; this.value = Math.round(v / s) * s; node.properties["width"] = this.value})
				CUSTOM_INT(this, "resolutionY", 512, function (v, _, node) {const s = this.options.step / 10; this.value = Math.round(v / s) * s; node.properties["height"] = this.value})
                
				addCanvas(this, app)

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
					},
					{ step: 10, max: 0 }

				)
				
				CUSTOM_INT(this, "x", 0, function (v, _, node) {transformFunc(this, v, node, 0)})
				CUSTOM_INT(this, "y", 0, function (v, _, node) {transformFunc(this, v, node, 1)})
				CUSTOM_INT(this, "width", 0, function (v, _, node) {transformFunc(this, v, node, 2)})
				CUSTOM_INT(this, "height", 0, function (v, _, node) {transformFunc(this, v, node, 3)})

				this.removeNodeInputs = function (indexesToRemove) {
					indexesToRemove.sort((a, b) => b - a);
				
					for (let i of indexesToRemove) {
						if (i === 0) { continue }
						this.removeInput(i)
						this.properties.values.splice(i, 1)
					}
				
					const inputLenght = this.inputs.length-1
				
					this.widgets[3].options.max = inputLenght
					if (this.widgets[3].value > inputLenght) {
						this.widgets[3].value = inputLenght
					}
				
					this.onResize(this.size)

					for (let i in this.inputs) {
						this.inputs[i].name = "conditioning" + i
					}
				}

				this.getExtraMenuOptions = function(_, options) {
					options.unshift(
						{
							content: "add input",
							callback: () => {
								this.properties["values"].push([0, 0, 0, 0])

								const index = this.inputs.length
								
								this.addInput("conditioning"+index, "CONDITIONING")

								this.widgets[3].options.max = index
								
								this.onResize(this.size)
							},
						},
						// {
						// 	content: "remove input",
						// 	callback: () => { this.removeNodeInputs([this.inputs.length-1]) },
						// },
						{
							content: "remove currently selected input",
							callback: () => { this.removeNodeInputs([this.widgets[3].value]) },
						},
						{
							content: "remove all unconnected inputs",
							callback: () => {
								let indexesToRemove = []

								for (let i = 1; i < this.inputs.length; i++) {
									if (!this.inputs[i].link) {
										indexesToRemove.push(i)
									}
								}

								if (indexesToRemove.length) {
									this.removeNodeInputs(indexesToRemove)
								}
								
							},
						}
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
			node.widgets[3].options["max"] = node.properties["values"].length-1
		}
	},
	
});