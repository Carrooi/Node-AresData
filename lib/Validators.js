(function() {
  var Validators;

  Validators = (function() {
    function Validators() {}


    /*
       Coffeescript implementation of PHP version from David Grudl
       http://latrine.dgx.cz/jak-overit-platne-ic-a-rodne-cislo
     */

    Validators.companyIdentification = function(identification) {
      var a, c, i, j;
      identification += '';
      identification = identification.replace(/\s+/g, '');
      if (identification.match(/^\d{8}$/) === null) {
        return false;
      }
      a = 0;
      for (i = j = 0; j <= 6; i = ++j) {
        a += identification.charAt(i) * (8 - i);
      }
      a = a % 11;
      switch (a) {
        case 0:
        case 10:
          c = 1;
          break;
        case 1:
          c = 0;
          break;
        default:
          c = 11 - a;
      }
      return parseInt(identification.charAt(7)) === c;
    };

    return Validators;

  })();

  module.exports = Validators;

}).call(this);
