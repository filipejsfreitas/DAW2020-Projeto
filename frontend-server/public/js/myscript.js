jQuery.expr[':'].regex = function(elem, index, match) {
    var matchParams = match[3].split(','),
        validLabels = /^(data|css):/,
        attr = {
            method: matchParams[0].match(validLabels) ? 
                        matchParams[0].split(':')[0] : 'attr',
            property: matchParams.shift().replace(validLabels,'')
        },
        regexFlags = 'ig',
        regex = new RegExp(matchParams.join('').replace(/^\s+|\s+$/g,''), regexFlags);
    return regex.test(jQuery(elem)[attr.method](attr.property));
  }

    $(document).on("click",".maisumautor", function () {
      var row = $(".inputautor").eq(0).clone().show()
      row.find("input:text").val("")
      
      $(".lista-autores").append(row)
  })
  $(document).on("click",".maisumatag", function () {
    var row = $(".inputtag").eq(0).clone().show()
    row.find("input:text").val("")
    
    $(".lista-tags").append(row)
})

$(document).on("click",':regex(id,^[0-9])', function () {
  console.log(this.id)
  $(this).parent('div').remove();
})
  