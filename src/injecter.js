function l(uri) {
	console.log('Injecter is opening ' + uri);
	var a = document.createElement('a');
	a.href = uri;
	document.body.appendChild(a);

	a.click();
}