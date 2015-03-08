module.exports = """
<?xml version="1.0" encoding="UTF-8"?>
<are:Ares_odpovedi xmlns:are="http://wwwinfo.mfcr.cz/ares/xml_doc/schemas/ares/ares_answer/v_1.0.1" xmlns:dtt="http://wwwinfo.mfcr.cz/ares/xml_doc/schemas/ares/ares_datatypes/v_1.0.4" xmlns:udt="http://wwwinfo.mfcr.cz/ares/xml_doc/schemas/uvis_datatypes/v_1.0.1" odpoved_datum_cas="2013-12-08T21:49:44" odpoved_pocet="1" odpoved_typ="Standard" vystup_format="XML" xslt="klient" validation_XSLT="/ares/xml_doc/schemas/ares/ares_answer/v_1.0.0/ares_answer.xsl" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://wwwinfo.mfcr.cz/ares/xml_doc/schemas/ares/ares_answer/v_1.0.1 http://wwwinfo.mfcr.cz/ares/xml_doc/schemas/ares/ares_answer/v_1.0.1/ares_answer_v_1.0.1.xsd" Id="ares">
<are:Odpoved>
<are:Error>
<dtt:Error_kod>1</dtt:Error_kod>
<dtt:Error_text>Na zadaný Dotaz by se vrátilo více odpovědí, než odpovídá parametru max_pocet. POZOR! Hrozí zablokování Vaší IP adresy! Prosím čtěte http://wwwinfo.mfcr.cz/ares/ares_xml_standard.html.cz#max</dtt:Error_text>
</are:Error>
<are:Pocet_zaznamu>-1</are:Pocet_zaznamu>
<are:Typ_vyhledani>OF</are:Typ_vyhledani>
</are:Odpoved>
</are:Ares_odpovedi>

"""
