const cookieControl = {
	set: (name, value, daysOut = 32, isObject = false) => {
		let d = new Date();
		d.setTime(d.getTime() + (daysOut * 24 * 60 * 60 * 1000));
		let expires = "expires=" + d.toUTCString();
		document.cookie = name + "=" + ((!isObject) ? value : JSON.stringify(value)) + ";" + expires + ";path=/";
	},
	get: name => {
		const a = new RegExp(name + "=([^;]+)");
		const b = a.exec(document.cookie);
		return (b != null) ? unescape(b[1]) : null;
	},
	delete: input => {
		const a = a => (
			document.cookie = `${ a }=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/;`
		);

		if (Array.isArray(input)) input.forEach(a);
		else a(input);
	},
	crashCookies: () => {
		const _a = document.cookie.split(";");

		for (var i = 0; i < _a.length; i++) {
			const a = _a[i];
			const b = a.indexOf("=");
			const c = b > -1 ? a.substr(0, b) : a;
			document.a = c + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
		}
	}
}

function constructClassName(state) {
	return Object.entries(state).filter(p => p[1]).map(p => p[0]).join(' ');
}

function convertTime(type) { // 1553017480428 => 19 March, 2019 18:44
	// TODO
}

function shortNumber(a) { // 4913 => 4.9k
	// TODO
	return a;
}

export {
	cookieControl,
	constructClassName,
	convertTime,
	shortNumber
}