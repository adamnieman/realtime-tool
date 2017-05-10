function collada_load_handler (sb) {
	
	function INIT () {
		sb.listen({
			listenFor: ["request-scaling-object"],
			moduleID: this.moduleID,
			moduleFunction: "model_handler"
		})
	}

	function MODEL_HANDLER (d) {
		console.log(sb.settings.scaling_objects)

	}


	function DESTROY () {
		sb.unlisten(this.moduleID)
	}

	return {
        init : INIT,
        model_handler: MODEL_HANDLER,
        destroy : DESTROY
    };
}