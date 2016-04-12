var cors = (function() {

  // Determine the underlying implementation to be used.
  var useXhr = 'withCredentials' in new XMLHttpRequest();
  var useXdr = !useXhr && typeof XDomainRequest !== 'undefined';
  var Request;
  if (useXhr) {
    Request = XMLHttpRequest;
  } else {
    Request = XDomainRequest;
  }

  // A function that does nothing.
  var noop = function() {};

  // Perform and store state for an HTTP request.
  function CorsRequest(method, url, data, done) {

    var self = this;

    function error(msg) {
      return new Error('corsRequest: ' + method + ' ' + url + ': ' + msg);
    }

    this.method = method;
    this.url = url;
    this.data = data;

    this.req = new Request();

    this.req.open(this.method, this.url);

    this.req.onerror = function() {
      self.err = error('error');
      done(self.err);
    };

    this.req.onload = function() {
      if (useXhr && self.req.readyState !== 4) {
        // XMLHttpRequest not yet complete.
        return;
      }
      if (useXhr && self.req.status === 0) {
        // XMLHttpRequest aborted, e.g. CORS error or connection reset.
        self.err = error('incomplete');
        done(self.err);
        return;
      }
      // Request complete.
      self.err = null;
      self.res = {
        status: useXhr ? self.req.status : 200,
        text: self.req.responseText,
        json: self.req.responseText.length && JSON.parse(self.req.responseText)
      };
      done(self.err, self.res);
    };

    if (this.data) {
      var payload = JSON.stringify(data);
      if(self.req.setRequestHeader) {
        self.req.setRequestHeader('Content-Type', 'application/json');
      }
    }

    self.req.send(payload || null);
  }


  // Instantiate CorsRequest with default arguments.
  function corsRequest() {

    var method, url, data, done;

    // corsRequest(method, url, ...)
    method = arguments[0].toUpperCase();
    url = arguments[1];

    if (arguments.length === 3) {
      if (typeof arguments[2] === 'function') {
        // corsRequest(method, url, done)
        done = arguments[2];
      } else {
        // corsRequest(method, url, data)
        data = arguments[2];
      }
    }

    if (arguments.length > 3) {
      // corsRequest(method, url, data, done)
      data = arguments[2];
      done = arguments[3];
    }

    return new CorsRequest(method, url, data, done || noop);
  }

  // Export public interface.
  return corsRequest;
})();
