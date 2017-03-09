function colladaLoadHandler (sb) {

	var objects = [
		{	
			name: "human",
			path: "assets/models/human.dae",
			height: 1.7,
			model: null,
		},

		{	
			name: "bus",
			path: "assets/models/double-decker-bus-4.dae",
			height: 4.3,
			model: null,
		}
	];

	function INIT () {
		sb.listen({
			listenFor: ["add-model"],
			moduleID: this.moduleID,
			moduleFunction: "modelHandler"
		})
	}

	function MODELHANDLER (d) {

		clear(d.parent);
		var object = selectObject(d.base_m)
		debug.log("Model selected: '"+object.name+"'.");

		load(object, function (model) {
			position(model, d.base_m);
			d.parent.add(model)
		})
	}

	function clear (group) {
		while (group.children.length > 0) {
			group.remove(group.children[0])
		};
	}

	function position (model, base) {

		var bBox = new THREE.Box3().setFromObject(model);

		model.position.y = -bBox.min.y;

		var offsetX = model.position.x-bBox.min.x;
		model.position.x = (base/2) + (base/10) + offsetX;

		var offsetZ = bBox.max.z - model.position.z;
		model.position.z = (0 - offsetZ)+(base/4);
	}

	function selectObject (base) {

		var minDiff = Infinity;
		var object = null

		var i;
		var l = objects.length;

		for (i=0; i<l; i++) {
			var diff = Math.abs((base*0.25)-objects[i].height);
			//the below selects larger scaling objects slightly earlier on
			//var diff = Math.abs((base*0.3)-objects[i].height);

			//var diff = base-objects[i].distance >= 0 ? base-objects[i].distance : Infinity;
			if (!object ||
				diff < minDiff) {
				minDiff = diff;
				object = objects[i];
			}
		}

		return object;
	}

	function load (object, callback) {
		var loader = new THREE.ColladaLoader();

		loader.load(object.path, function (result) {
			object.model = result.scene.children[0].clone();
			object.model.rotation.x = -Math.PI/2
			object.model.rotation.z = Math.PI/4
			object.model.castShadow = true;

			if (object.name === "human") {
				changeMaterial (object.model.children, sb.three.materials.model);
			}
			makeCorrectSize (object.model, object.height);
			giveShadow (object.model.children);
			object.distance = getGreatestDistance (object.model);
			callback(object.model);
		});
	}

	function getGreatestDistance (object) {
		var bBox = new THREE.Box3().setFromObject(object);

		var w = bBox.max.x - bBox.min.x
		var h = bBox.max.y - bBox.min.y
		var d = bBox.max.z - bBox.min.z

		var distance = (w > h) ? w : h;
		distance = (distance > d) ? distance : d;

		return distance;
	}

	function giveShadow (childGroup) {
			   	
		for (var w = 0; w < childGroup.length; w++){
			if (childGroup[w].material){
				//console.log(childGroup[w]);
				childGroup[w].castShadow = true;
		    	//childGroup[w].receiveShadow = true;
			}
		    else {
				 giveShadow (childGroup[w].children)
			}
		}
	}

	function changeMaterial (childGroup, material) {
			   	
		for (var w = 0; w < childGroup.length; w++){
			if (childGroup[w].material){
				 childGroup[w].material = material
			}
		    else {
				 changeMaterial (childGroup[w].children, material)
			}
		}
	}

	function makeCorrectSize (object, correctHeight){
		        	
		var bBox = new THREE.Box3().setFromObject(object);
		var currentHeight = bBox.max.y - bBox.min.y
		var scale = (1/currentHeight) * correctHeight		
				    
		object.scale.set(scale, scale, scale);
		object.position.x = 0;
		object.position.y = 0;
		object.position.z = 0;
				
	}
	
	function DESTROY () {
		sb.unlisten(this.moduleID)
		objects = null;
		makeCorrectSize, changeMaterial, giveShadow, selectObject, clear, position, load = null;
	}

	return {
        init : INIT,
        modelHandler: MODELHANDLER,
        destroy : DESTROY
    };
}