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

function addCanvas(node, app) {
	const MIN_SIZE = 100;

	function computeSize(size) {
		if (node.widgets[0].last_y == null) return;

		let y = node.widgets[0].last_y;
		let freeSpace = size[1] - y;

		// Compute the height of all non customtext widgets
		let widgetHeight = 0;
		for (let i = 0; i < node.widgets.length; i++) {
			const w = node.widgets[i];
			if (w.type === "customCanvas") {

			} else {
				if (w.computeSize) {
					widgetHeight += w.computeSize()[1] + 4;
				} else {
					widgetHeight += LiteGraph.NODE_WIDGET_HEIGHT + 4;
				}
			}
		}

		// See how large each text input can be
		freeSpace -= widgetHeight;

		if (freeSpace < MIN_SIZE) {
			// There isnt enough space for all the widgets, increase the size of the node
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

		node.inputHeight = freeSpace;
	}

	const widget = {
		type: "customCanvas",
		name: "name",
		get value() {
			//return this.inputEl.value;
		},
		set value(x) {
			//this.inputEl.value = x;
		},
		draw: function (ctx, node, widgetWidth, widgetY) {
			if (!this.parent.inputHeight) {
				// If we are initially offscreen when created we wont have received a resize event
				// Calculate it here instead
				computeSize(node.size);
			}

			const visible = true //app.canvasblank.ds.scale > 0.5 && this.type === "customCanvas";
			this.canvas.hidden = !visible;

			
			const colors = ["rgba(255,0,0,0.5)", "rgba(0,255,0,0.5)", "rgba(0,0,255,0.5)", "rgba(255,255,0,0.5)", "rgba(255,0,255,0.5)", "rgba(0,255,255,0.5)", "rgba(255,0,0,0.5)", "rgba(0,255,0,0.5)"]
            const margin = 10

            const widgetHeight = this.parent.inputHeight
            const values = this.parent.properties["values"]
			const width = this.parent.properties["width"]
			const height = this.parent.properties["height"]

            const scale = Math.min((widgetWidth-margin*2)/width, (widgetHeight-margin*2)/height)

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

			ctx.fillStyle = "#FFFFFF";
			ctx.fillRect(widgetX, widgetY, backgroudWidth, backgroundHeight);

			for (const [k, v] of values.entries()) {

				if (node.inputs[k].link === null) {continue;}
				
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

				ctx.fillStyle = colors[k];
				ctx.fillRect(widgetX+x, widgetY+y, w, h);
			}
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

	node.onRemoved = function () {
		// When removing this node we need to remove the input from the DOM
		for (let y in this.widgets) {
			if (this.widgets[y].canvas) {
				this.widgets[y].canvas.remove();
			}
		}
	};

	node.onResize = function (size) {
		computeSize(size);
	}

	return { minWidth: 200, minHeight: 200, widget }
}

function transformFunc(widget, value, node, index) {
	const s = widget.options.step / 10;
	widget.value = Math.round(value / s) * s;
	node.properties["values"][node.widgets[3].value][index] = widget.value
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

				this.setProperty("values", [])
				for (let i = 0; i < 8; i++) {
					this.properties["values"].push([0, 0, 256, 256])
				}

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
					{ step: 10, max: 7 }

				)
				
				CUSTOM_INT(this, "x", 0, function (v, _, node) {transformFunc(this, v, node, 0)})
				CUSTOM_INT(this, "y", 0, function (v, _, node) {transformFunc(this, v, node, 1)})
				CUSTOM_INT(this, "width", 0, function (v, _, node) {transformFunc(this, v, node, 2)})
				CUSTOM_INT(this, "height", 0, function (v, _, node) {transformFunc(this, v, node, 3)})

				return r;
			};
		}
	},
});