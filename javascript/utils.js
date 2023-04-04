export function CUSTOM_INT(node, inputName, val, func, config = {}) {
	return {
		widget: node.addWidget(
			"number",
			inputName,
			val,
			func, 
			Object.assign({}, { min: 0, max: 4096, step: 640, precision: 0 }, config)
		),
	};
}

export function recursiveLinkUpstream(node, type, depth, index=null) {
	depth += 1
	let connections = []
	const inputList = (index !== null) ? [index] : [...Array(node.inputs.length).keys()]
	if (inputList.length === 0) { return }
	for (let i of inputList) {
		const link = node.inputs[i].link
		if (link) {
			const nodeID = node.graph.links[link].origin_id
			const slotID = node.graph.links[link].origin_slot
			const connectedNode = node.graph._nodes_by_id[nodeID]

			if (connectedNode.outputs[slotID].type === type) {

				connections.push([connectedNode.id, depth])

				if (connectedNode.inputs) {
					const index = (connectedNode.type === "LatentComposite") ? 0 : null
					connections = connections.concat(recursiveLinkUpstream(connectedNode, type, depth, index))
				} else {
					
				}
			}
		}
	}
	return connections
}

export function transformFunc(widget, value, node, index) {
	const s = widget.options.step / 10;
	widget.value = Math.round(value / s) * s;
	node.properties["values"][node.widgets[node.index].value][index] = widget.value
	if (node.widgets_values) { 
		node.widgets_values[2] = node.properties["values"].join()
	}
}

export function swapInputs(node, indexA, indexB) {
	const linkA = node.inputs[indexA].link
	let origin_slotA = null
	let node_IDA = null
	let connectedNodeA = null
	let labelA = node.inputs[indexA].label || null

	const linkB = node.inputs[indexB].link
	let origin_slotB = null
	let node_IDB = null
	let connectedNodeB = null
	let labelB = node.inputs[indexB].label || null

	if (linkA) {
		node_IDA = node.graph.links[linkA].origin_id
		origin_slotA = node.graph.links[linkA].origin_slot
		connectedNodeA = node.graph._nodes_by_id[node_IDA]

		node.disconnectInput(indexA)
	}

	if (linkB) {
		node_IDB = node.graph.links[linkB].origin_id
		origin_slotB = node.graph.links[linkB].origin_slot
		connectedNodeB = node.graph._nodes_by_id[node_IDB]

		node.disconnectInput(indexB)
	}

	if (linkA) {
		connectedNodeA.connect(origin_slotA, node, indexB)
	}

	if (linkB) {
		connectedNodeB.connect(origin_slotB, node, indexA)
	}

	node.inputs[indexA].label = labelB
	node.inputs[indexB].label = labelA
	
}

export function renameNodeInputs(node, name, offset=0) {
	for (let i=offset; i < node.inputs.length; i++) {
		node.inputs[i].name = `${name}${i-offset}`
	}
}

export function removeNodeInputs(node, indexesToRemove, offset=0) {
	indexesToRemove.sort((a, b) => b - a);

	for (let i of indexesToRemove) {
		if (node.inputs.length <= 2) { console.log("too short"); continue } // if only 2 left
		node.removeInput(i)
		node.properties.values.splice(i-offset, 1)
	}

	const inputLenght = node.properties["values"].length-1

	node.widgets[node.index].options.max = inputLenght
	if (node.widgets[node.index].value > inputLenght) {
		node.widgets[node.index].value = inputLenght
	}

	node.onResize(node.size)
}

export function getDrawColor(percent, alpha) {
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

export function computeCanvasSize(node, size) {
	if (node.widgets[0].last_y == null) return;

	const MIN_SIZE = 200;

	let y = LiteGraph.NODE_WIDGET_HEIGHT * Math.max(node.inputs.length, node.outputs.length) + 5;
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