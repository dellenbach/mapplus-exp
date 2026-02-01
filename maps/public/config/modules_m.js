/*
	 Require all the items defined in the index_lang.htm as the parser will need them
	 and also the elements which will be nedded further while building the gui elements
	 in the startup (will be handled in a synchrone workflow as already loaded).
 */
require([
    "dojo/ready",
    "dojo/parser",
    "dojo/dom-construct",
    "dojo/dom-attr",
    "dojo/dom-style",
    "dojo/dom-geometry",
    "dijit/layout/BorderContainer",
    "dijit/layout/AccordionContainer",
    "dijit/layout/ContentPane",
    "dijit/TitlePane",
    "dijit/layout/TabContainer",
    "dojox/layout/TableContainer",
    "dijit/Dialog",
    "dijit/form/Select",
    "dijit/form/Button",
    "dijit/form/TextBox",
    "dijit/form/CheckBox",
    "dijit/Tooltip",
    "dojo/data/ItemFileReadStore",
    "dojox/grid/DataGrid",
    "dijit/form/FilteringSelect",
    "dijit/form/Textarea",
    "dijit/form/ValidationTextBox",
    "dojox/layout/FloatingPane",
    "dijit/form/Button",
    "dijit/form/RadioButton",
    "njs/form/GroupToggleButton",
    "njs/data/ComboBoxReadSolrStore",
    "dojo/topic",
    "dojo/fx",
    "dojox/mobile/deviceTheme",

	"dijit/form/Form",
	"dijit/Toolbar",
	"dojox/form/Uploader"
], function(ready, parser, domConstruct, domAttr) {
    ready(function() {


        //build the page
        parser.parse();

        var lyr_mnu_obj = null;
        if (dojo.byId("layer_menu_wrapper")) lyr_mnu_obj = "#layer_menu_wrapper";
        else if (dojo.byId("layer_menu2_wrapper")) lyr_mnu_obj = "#layer_menu2_wrapper";

        // Add an element in the accordion title for the layer manager
        // section in order to display a "waitng" message when loading
        // the layers
        // Such an object can be placed anywhere in the page if containing
        // the id "infolay_wait"
        if (lyr_mnu_obj!=null){
        var node = document.createElement('div');
        dojo.attr(node, "role", "presentation");
        dojo.attr(node, "id", "infolay_wait");
        dojo.attr(node, "style", "display:none;height:20px;border:none;font-size:0;position: relative;text-align: right;");
        var subnode2 = document.createElement('img');
        dojo.attr(subnode2, "src", "./../core/templates/nwow_floating/img/llayers.gif");
        dojo.attr(subnode2, "style", "border:none;font-size:0");
        dojo.place(subnode2, node, "last");
        dojo.place(node, dojo.query("#layer_menu_wrapper .dijitInline.dijitAccordionArrow")[0].parentElement, "last");
        }
        if (dojo.byId("layer_menu_button")){
            dojo.setStyle(dojo.byId("layer_menu_button"), "background-color", "none");
            
        }
        if (dojo.byId("layer_menu2_button")){
            dojo.setStyle(dojo.byId("layer_menu2_button"), "background-color", "none");
           
        }
        njs.AppManager.initApp();

    });
});
function changemappluslang(langparam){
    window.location = window.location.href.replace("lang="+njs.AppManager.Language,"lang="+langparam)
}