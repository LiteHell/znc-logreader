$(function(){
    $("#searchBtn").click(function(evt){
        evt.preventDefault();
        document.title = "Searching...";
        $(this).attr("disabled", true);
        $(this).text("Searching...");
        $('<article class="message is-info"><div class="message-body">Searching... please wait</div></article>').prependTo($("section.section"));
        $.ajax({
            type: 'POST',
            url: '/search',
            data: $("form").serialize(),
            dataType: 'html',
            success: function(data) {
                document.title = "Search result";
                $("section.section").html(data);
            },
            error: function(request, status, error) {
                document.title = "Error";
                $("section").html('<article class="message is-danger"><div class="message-body">An error occured: ' + error + '</div></article>')
                console.log(request.responseText);
            }
        })
    })
});