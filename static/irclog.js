var colorHash = new ColorHash();
var colorableNicks = document.querySelectorAll('.colorable');
for (var i = 0; i < colorableNicks.length; i++) {
    var nick = colorableNicks[i];
    nick.style.color = colorHash.hex(nick.innerHTML);
}