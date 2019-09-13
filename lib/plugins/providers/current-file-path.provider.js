'use babel'

export default class CurrentFilePathProvider {

}

CurrentFilePathProvider.prototype.activate = function() {
}
CurrentFilePathProvider.prototype.dispose = function() {
}
CurrentFilePathProvider.prototype.canActivate = function(req) {
	return true;
}
CurrentFilePathProvider.resolvePath = function(req) {
	let filePath = '';
	return {
		searchPath: filePath,
		prefix: req.prefix
	};
}
