var fs = require("fs");
var path = require("path");
var httpProxy = require("http-proxy");
var express = require("express");
var ghostPath = path.join(__dirname, "../node_modules/ghost/");
var hbs = require(ghostPath + "node_modules/express-hbs");
app = express();

var config = require("./helpers/config");
var proxy = config.hosts.ghost;

// force trailing slash on custom routes
function slash(req, res, next) {
  if(req.url.substr(-1) !== "/") {
    res.redirect(301, req.url + "/");
  } else {
    next();
  }
};

// custom rendering for the wiki
var theme = path.join(__dirname, "../content/themes/osmc");
app.engine("hbs", hbs.express4({
  partialsDir: theme + "/partials"
}));
app.set("view engine", "hbs");
app.set("views", theme);

// proxy settings
var proxyAll = httpProxy.createProxyServer({
  prependPath: false,
  ignorePath: false,
}).on("error", function(err, req, res) {
  res.end();
});
var proxySingle = httpProxy.createProxyServer({
  prependPath: true,
  ignorePath: true,
}).on("error", function(err, req, res) {
  res.end();
});

// routes

app.all("/", function(req, res){
  var url = proxy + "/home";
  proxySingle.web(req, res, {target: url});
});

app.all("/home", function(req, res){
  var url = proxy + "/404";
  proxySingle.web(req, res, {target: url});
});

app.all("/blog", slash, function(req, res){
  var url = proxy + "/";
  proxySingle.web(req, res, {target: url});
});

app.all("/blog/page/1", function(req, res){
  res.redirect("/blog");
});

app.all("/blog/page/:page", slash, function(req,res) {
	var url = proxy + "/page/" + req.params.page;
  proxySingle.web(req, res, {target: url});
});

// wiki

app.all("/wiki", slash, function(req, res){
  var url = proxy + req.url;
  proxySingle.web(req, res, {target: url});
});

app.get("/wiki/:var(general|raspberry-pi|vero)?", function(req, res) {
	res.redirect("/wiki");
});

app.get("/help/wiki/*", function(req, res) {
	res.redirect("/wiki");
});

var wikiPost = require("./modules/wiki").post;
app.get("/wiki/*", slash, function(req, res) {
  var post = wikiPost(req.url);
  var wiki = {};
  wiki["post"] = post;

  if (post) {
    res.render("page-wiki-post.hbs", {wiki: wiki});
  } else {
    proxySingle.web(req, res, {target: proxy + "/404"});
  }
});

// store

app.all("/store", slash, function(req, res){
  var url = proxy + req.url;
  proxySingle.web(req, res, {target: url});
});

var storeProduct = require("./modules/store").product;
app.get("/store/*", slash, function(req, res) {
  var product = storeProduct(req.url);
  var store = {};
  store["product"] = product;

  if (product) {
    res.render("page-store-product.hbs", {store: store});
  } else {
    proxySingle.web(req, res, {target: proxy + "/404"});
  }
});

// newsletter

app.get("/newsletter/:id", function(req, res) {
  var newsletter = require("./modules/newsletter");
  newsletter(req.params.id).then(function(data) {
    res.send(data);
  });
});

// redirects

app.get("/download/**/*", function(req, res){
  res.redirect("/download");
});

app.get("/author/*", function(req, res){
  res.redirect("/blog");
});

app.get("/about/corporate/eula", function(req, res) {
	res.redirect("/corporate-and-legal/#eula");
});

app.get("/status/wiki", function(req, res) {
	res.sendFile(path.join(__dirname, "/static", "wiki-status.html"));
});

app.get("/banner", function(req, res){
  res.redirect("/404");
});

app.get("/help", function(req, res) {
  res.redirect("/");
});

// files

app.use("/assets/images", express.static(theme + "/assets/img/lightbox"));

// all

app.all("/*", function(req, res){
  var url = proxy + req.url;
  proxyAll.web(req, res, {target: url});
});
