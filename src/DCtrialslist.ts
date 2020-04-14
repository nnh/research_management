function DCtrialslist() {
    var spreadsheet = SpreadsheetApp.getActive();
    var sheetDatacenter = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Datacenter");
    var items = sheetDatacenter.getDataRange().getValues();
    var DC1　= 0;   //プロトコールID
    var DC2　= 47;  //対象1(患者年齢)
    var DC3　= 48;  //対象2(疾患領域)
    var DC4　= 15;  //システム
    var DC5　= 16;  //CDISC対応
    var DC6　= 40;  //登録数
    var DC7　= 7;   //研究種別
    var DC11　= 14;   //Status 
    var DC12　= 13;   //研究グループ（資金源）
    var DC13　= 49;   //試験の枠組 
    var DC14　= 19;   //登録開始
    var DC15　= 2;   //PI
    var DC16　= 3;   //PI所属機関
    var DC17　= 6;   //研究費（院内以外は他施設共同試験）
    var sheetMembers = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Members");
    var items2 = sheetMembers.getDataRange().getValues();
    var mem1 = 2    //Group
    var mem2 = 3    //Sortoder
    var targetSheetFull = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("DCtrialslistFull");  
    var oldtargetSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("DCtrialslist");
    var study = [];
    var number = 1;
    var group = "";
    var star ="";
    var other ="";
    var status　= "";
    var statuscode = 0;
    var countregistry　= 0;
    var countbefore　= 0;
    var countafter　= 0;
    var listcountregistry　= 0;
    var listcountbefore　= 0;
    var listcountafter　= 0;  
    var registry　= "";
    var before　= "";
    var after　= "";  
    var sortcode　= "";
    var del　= "";  
  
    targetSheetFull.activate()

//***  前提条件
//***  A1セルに「データの入力規則」、「表示形式：日付」を設定すること
//***  条件：日付、有効な日付　　無効なデータの場合：入力を拒否

    var ReferenceDate = targetSheetFull.getRange("A1");
    if (ReferenceDate.isBlank()){
      Browser.msgBox("A1をダブルクリックして基準日を選択してから、再度「DCtrialslist作成」を実行してください。\\n\\nスクリプトを終了します。");
      return;
    } else {
      var RefDate = Utilities.formatDate(ReferenceDate.getValue(), "JST", "yyyy/MM/dd");      
      var msg = Browser.msgBox("『" + RefDate + "』を基準日として実行します。よろしければOKを選択してください。\\n\\n日付を変更する場合キャンセルを選択して、A1をダブルクリックして正しい日付を選択してください。\\n\\n誤って起動した場合は、キャンセルを選択してください。", Browser.Buttons.OK_CANCEL);
        if (msg == "cancel"){
          Browser.msgBox("スクリプトを終了します。");
          return;
        }
    }
//前回値クリア
    targetSheetFull.getRange("B1:Q1").clear();
    targetSheetFull.getRange("A2:Q1000").clear();  
    targetSheetFull.clearConditionalFormatRules();


    for (var i = 1; i < items.length; i++) {
        if (items[i][DC11] != "NoSupport" && items[i][DC11] != "Uncertain" && items[i][DC1] != "") {
//掲示対象判定
          switch(true){
            case (items[i][DC11] == "Discontinued") || (items[i][DC11] == "Completed"):
              del = "Delete"
              break;
            default:
              del = ""
              break;
          }
//status
          switch(true){
            case items[i][DC7] == "レジストリ":
              status　= "疫学研究/疾患登録"
              statuscode = 3
              countregistry++
                if (del == ""){
                  listcountregistry++}
              break;
            case items[i][DC14] > ReferenceDate.getValue() || items[i][DC14] == "" || items[i][DC14] == "-":
              status = "開始前"
              statuscode = 1
              countbefore++
                if (del == ""){
                  listcountbefore++}
              break;
            case items[i][DC14] <= ReferenceDate.getValue():
              status = "開始後"
              statuscode = 2
              countafter++
                if (del == ""){
                  listcountafter++}
              break;
            default:
              status = "開始前"
              statuscode = 1
              countbefore++
                if (del == ""){
                  listcountbefore++}
              break;
          }
//研究グループ（資金源）
          switch(true){
//           case items[i][DC13] == "医師主導治験":
//              group = "-"
//              break;
            case /JPLSG/.test(items[i][DC1]):
              group = "JPLSG"
              break;
            case /JALSG/.test(items[i][DC1]):
              group = "JALSG"
              break;
            case /JCCG/.test(items[i][DC1]):
              group = "JCCG"
              break;
            default:
              group = items[i][DC12]
              break;
          }
//GCP/ICH-GCP対応
          switch(true){
            case (items[i][DC13] == "医師主導治験") || (items[i][DC13] == "国際共同試験" && items[i][DC4] == "Ptosh"):
              star = "○"
              break;
            default:
              star = ""
              break;
          }
//多施設共同研究
          switch(true){
            case (items[i][DC17] == "院内"):
              other = ""
              break;
            default:
              other = "○"
              break;
          }
//sortcode
        for (var j = 1; j < items2.length; j++) {
          if (items2[j][mem1] == group ) {
            sortcode = items2[j][mem2]
            break;
          }else{
            sortcode = ""
          }         
        }
        study[number] = [status,items[i][DC1],group,items[i][DC2],items[i][DC3],items[i][DC4],items[i][DC5],items[i][DC6],star,items[i][DC7],items[i][DC15],items[i][DC16],other,items[i][DC11],sortcode,statuscode,items[i][DC14] ,del];
        number++;
        }
    }
  
    study[0] = ["","研究名","研究グループ（資金源）","対象1(患者年齢)","対象2(疾患領域)","システム","CDISC対応","登録数"+RefDate+"現在","試験の枠組（○；GCP/ICH-GCP対応）","","PI","PI所属機関","多施設共同試験","Status","",0,"",""];
    targetSheetFull.getRange(1,1,number,18).setValues(study).sort([{column:16, ascending:true},{column:9,ascending:false},{column:15,ascending:true},{column:3,ascending:true},{column:17, ascending:false},{column:2, ascending:true}]);

//条件付き書式
    var range = targetSheetFull.getRange("C2:C300");
    var rule = SpreadsheetApp.newConditionalFormatRule()
             .whenFormulaSatisfied('=and(B2<>"",O2="")')
             .setBackground("#B7E1CD")
             .setRanges([range])
             .build();
    var rules = targetSheetFull.getConditionalFormatRules();
    rules.push(rule);
    targetSheetFull.setConditionalFormatRules(rules);  

    var range = targetSheetFull.getRange("D2:G300");
    var rule = SpreadsheetApp.newConditionalFormatRule()
             .whenFormulaSatisfied('=and($B2<>"",D2="")')
             .setBackground("#B7E1CD")
             .setRanges([range])
             .build();
    var rules = targetSheetFull.getConditionalFormatRules();
    rules.push(rule);
    targetSheetFull.setConditionalFormatRules(rules);  

    var range = targetSheetFull.getRange("H2:H300");
    var rule = SpreadsheetApp.newConditionalFormatRule()
             .whenFormulaSatisfied('=and(OR(P2=2,P2=3),H2="")')
             .setBackground("#B7E1CD")
             .setRanges([range])
             .build();
    var rules = targetSheetFull.getConditionalFormatRules();
    rules.push(rule);
    targetSheetFull.setConditionalFormatRules(rules);  
  
    var range = targetSheetFull.getRange("J2:J300");
    var rule = SpreadsheetApp.newConditionalFormatRule()
             .whenFormulaSatisfied('=and(B2<>"",J2="")')
             .setBackground("#B7E1CD")
             .setRanges([range])
             .build();
    var rules = targetSheetFull.getConditionalFormatRules();
    rules.push(rule);
    targetSheetFull.setConditionalFormatRules(rules); 
  
//結合処理
    targetSheetFull.getRange('I1:J1').mergeAcross()
  
    before = targetSheetFull.getRange(2,1,countbefore,1);
    before.merge()
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
    targetSheetFull.getRange(2,1,countbefore,1).setValue('開\n始\n前\n'+countbefore+'\n件');
  
    after = targetSheetFull.getRange(countbefore+2,1,countafter,1);
    after.merge()
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
    targetSheetFull.getRange(countbefore+2,1,countafter,1).setValue('開\n始\n後\n'+countafter+'\n件');
  
    registry = targetSheetFull.getRange(countbefore+countafter+2,1,countregistry,1);
    registry.merge()
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setVerticalText(true)
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
    targetSheetFull.getRange(countbefore+countafter+2,1,countregistry,1).setValue('疫学研究/疾患登録'+countregistry+'件');

//位置調整
    targetSheetFull.getRange('H:I').setHorizontalAlignment('center');  
    targetSheetFull.getRange('M:M').setHorizontalAlignment('center');
    targetSheetFull.getRange('A1:N1').setHorizontalAlignment('center'); 

//背景色  
    targetSheetFull.getRange('A1:N1').setBackground('#d1ffd1');
    targetSheetFull.getRange(2,1,countbefore,1).setBackground('#ffffd1');
    targetSheetFull.getRange(countbefore+2,1,countafter,1).setBackground('#b1d1ff');
    targetSheetFull.getRange(countbefore+countafter+2,1,countregistry,1).setBackground('#f4c7c3');

//罫線
    targetSheetFull.getRange(1,1,countbefore+countafter+countregistry+1,8).setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);
    targetSheetFull.getRange(1,9,countbefore+countafter+countregistry+1,2).setBorder(true, true, true, true, null, null, '#000000', SpreadsheetApp.BorderStyle.SOLID)
  　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　.setBorder(null, null, null, null, null, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);
    targetSheetFull.getRange(1,11,countbefore+countafter+countregistry+1,4).setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);
    targetSheetFull.getRange('A1:N1').setBorder(true, true, true, true, null, null, '#000000', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    targetSheetFull.getRange(2,1,countbefore,14).setBorder(true, true, true, true, null, null, '#000000', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    targetSheetFull.getRange(countbefore+2,1,countafter,14).setBorder(true, true, true, true, null, null, '#000000', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    targetSheetFull.getRange(countbefore+countafter+2,1,countregistry,14).setBorder(true, true, true, true, null, null, '#000000', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    targetSheetFull.getRange(1,1,countbefore+countafter+countregistry+1,1).setBorder(true, true, true, true, null, null, '#000000', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  
//条件付き書式用データ非表示  
    targetSheetFull.hideColumns(15,4)

    targetSheetFull.autoResizeColumns(1,9);
    targetSheetFull.setColumnWidth(3, 250); 
    targetSheetFull.setColumnWidth(4, 230);
    targetSheetFull.setColumnWidth(5, 230); 
    targetSheetFull.setColumnWidth(7, 100);    
    targetSheetFull.setColumnWidth(8, 150);  
    targetSheetFull.setColumnWidth(9, 30);  
    targetSheetFull.setColumnWidth(10, 200);  
    targetSheetFull.setColumnWidth(11, 200);  
    targetSheetFull.setColumnWidth(12, 300); 

//DCtrialslist加工
//前回作成のDCtrialslistを削除、DCtrialslistFullをコピーして新しくDCtrialslistを作成
    spreadsheet.deleteSheet(oldtargetSheet);
    targetSheetFull.activate() ;
    var newtargetSheet = targetSheetFull.copyTo(spreadsheet)
    newtargetSheet.setName("DCtrialslist");
    spreadsheet.setActiveSheet(newtargetSheet);
    spreadsheet.moveActiveSheet(9);　　//シートを差し込む位置

//Discontinued,Completedの行を削除
    for(var j = 2; j < countbefore+countafter+countregistry; j++){
      var range = newtargetSheet.getRange("R"+ j);
      var value = range.getDisplayValue();
      if(value == "Delete"){
        var start_row = j;
        var num_row = 1;
        newtargetSheet.deleteRows(start_row, num_row);
        j = j - 1;
      }
    }

//PI~Status列削除
    newtargetSheet.deleteColumns(11, 4);

//件数入力
    newtargetSheet.getRange(2,1,listcountbefore,1).setValue('開\n始\n前\n'+listcountbefore+'\n件');
    newtargetSheet.getRange(listcountbefore+2,1,listcountafter,1).setValue('開\n始\n後\n'+listcountafter+'\n件');
    newtargetSheet.getRange(listcountbefore+listcountafter+2,1,listcountregistry,1).setValue('疫学研究/疾患登録'+listcountregistry+'件');

//罫線
    newtargetSheet.getRange(1,1,listcountbefore+listcountafter+listcountregistry+1,8).setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);
    newtargetSheet.getRange(1,9,listcountbefore+listcountafter+listcountregistry+1,2).setBorder(true, true, true, true, null, null, '#000000', SpreadsheetApp.BorderStyle.SOLID)
  　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　.setBorder(null, null, null, null, null, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);
    newtargetSheet.getRange('A1:J1').setBorder(true, true, true, true, null, null, '#000000', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    newtargetSheet.getRange(2,1,listcountbefore,10).setBorder(true, true, true, true, null, null, '#000000', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    newtargetSheet.getRange(listcountbefore+2,1,listcountafter,10).setBorder(true, true, true, true, null, null, '#000000', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    newtargetSheet.getRange(listcountbefore+listcountafter+2,1,listcountregistry,10).setBorder(true, true, true, true, null, null, '#000000', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    newtargetSheet.getRange(1,1,listcountbefore+listcountafter+listcountregistry+1,1).setBorder(true, true, true, true, null, null, '#000000', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

    Browser.msgBox("スクリプトの実行が終わりました。");
  
}