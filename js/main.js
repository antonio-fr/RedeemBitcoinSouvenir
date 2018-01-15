var bitcore = require('bitcore-lib');
window.onload = function () {
	document.getElementById("gomove").onclick = function(){
		Move();
	};
	document.getElementById("gokeyscan").onclick = function(){
			var overlay = document.getElementById("overlay");
			overlay.classList.add("toggle");
			$('#loading').hide();
			$('#reader').show();
			document.body.scrollTop = 0;
			$('#reader').html5_qrcode(function(data){
				var testwif = bitcore.PrivateKey.getValidationError(data);
				if (!testwif){
					$('#reader').html5_qrcode_stop();
					$('#reader').empty();
					overlay.classList.remove("toggle");
					document.getElementById('pvkey').value = data;
					document.body.scrollTop = document.body.scrollHeight;
				}
				else{ console.log(testwif) }
		}, function(error){
			//$('.output').text("ERREUR avec la webcam");
		}, function(videoError){
			$('.output').text("ERREUR ne peut ouvrir le flux video");
		});
	};
	document.getElementById("goadrscan").onclick = function(){
		var overlay = document.getElementById("overlay");
		overlay.classList.add("toggle");
		$('#loading').hide();
		$('#reader').show();
		document.body.scrollTop = 0;
		$('#reader').html5_qrcode(function(data){
			if (data.startsWith("bitcoin:")){ data = data.substring(8) };
			var testadr = bitcore.Address.getValidationError(data);
			if (!testadr){
				$('#reader').html5_qrcode_stop();
				$('#reader').empty();
				overlay.classList.remove("toggle");
				console.log(data);
				document.getElementById('toaddr').value = data;
				document.body.scrollTop = document.body.scrollHeight;
			}
			else{ console.log(testadr) }
		}, function(error){
			//$('.output').text("ERREUR avec la webcam");
		}, function(videoError){
			$('.output').text("ERREUR ne peut ouvrir le flux video");
		});
	};
	document.getElementById("stopscan").onclick = function(){
		$('#loading').hide();
		$('#reader').show();
		$('#reader').html5_qrcode_stop();
		$('#reader').empty();
		document.getElementById("overlay").classList.remove("toggle");
		document.body.scrollTop = document.body.scrollHeight;
	};
};
function GetUtxo(){
	console.log("Getting utxo");
	$('#payaddr').hide();
	$('#amnt').hide();
	$.ajax({
	url: "https://api.blockcypher.com/v1/btc/main/txs/b7a79af4e7ff6d38968cd5999add62ac514d1a4775e1f0877233787a8cd8d4b9?limit=400",
	type: "GET",
	cache: false,
	dataType: "json",
	success: function (msg) {
		var validaddr = false;
		for (var outidx in msg.outputs){
			console.log(outidx);
			if (msg.outputs[outidx].addresses != null && msg.outputs[outidx].addresses[0] == p2shAddress){
				console.log(JSON.stringify(msg.outputs[outidx]));
				validaddr = true;
				$('.output').text("Data OK, processing ...");
				$('#redeem').text(msg.outputs[outidx]);
				console.log(outidx);
				dotransaction(
					msg.outputs[outidx], "b7a79af4e7ff6d38968cd5999add62ac514d1a4775e1f0877233787a8cd8d4b9",
					parseInt(outidx,10)
				);
			}
		}
		if (!validaddr){
			$('.output').text("ERREUR avec la CLE PRIVEE fournie");
		}
	},
	error: function () {
		$('.output').text("ERREUR Internet");
	}
});
}

var bitcore = require('bitcore-lib');
const BuildTransaction = function(txid, outid , destaddr, amount, script) {
	var transaction = new bitcore.Transaction().from({
		"txid": txid,
		"vout": outid,
		"scriptPubKey": script,
		"satoshis": 50000,
	});
	transaction.to(destaddr, outputtx)
		.lockUntilDate(1514761200, 0);
	var pvkeyuser = $('#pvkey').val();
	var privateKey = bitcore.PrivateKey.fromWIF(pvkeyuser);
	transaction.inputs[0].sequenceNumber = 0;
	console.log(redeemScript);
	var signature = bitcore.Transaction.sighash.sign(transaction, privateKey, bitcore.crypto.Signature.SIGHASH_ALL, 0, redeemScript);
	transaction.inputs[0].setScript(
		bitcore.Script.empty()
		.add(signature.toTxFormat())
		.add(privateKey.toPublicKey().toBuffer())
		.add(redeemScript.toBuffer())
	);
	return transaction;
};
function end(message){
	var assetidnode = document.createElement('div');
	assetidnode.innerHTML = 'Transaction effectuee';
	var txdiv = document.createElement('div');
	document.getElementById("page").appendChild(assetidnode);
	document.getElementById("page").appendChild(txdiv);
	txdiv.style.margin = "20px";
	document.body.scrollTop = document.body.scrollHeight;
	$('.output').text(message);
};
function dotransaction(utxo_input, txid, outid){
	$('#qrcode').hide();
	console.log("Transaction generation and signing");
	var transaction = BuildTransaction(txid, outid, destaddrfunds, utxo_input.value, utxo_input.script)
	$('.output').text("Transaction construite");
	var pushtx = { tx: transaction.toString() };
	$.post('https://api.blockcypher.com/v1/btc/main/txs/push', JSON.stringify(pushtx))
		.done(function(srvrep){
			end(srvrep.tx.hash);
		})
		.fail(function(){ end("Erreur broadcast Tx"); }
		);
};
function redeem() { 
	$('output').text('Patientez...');
	var pvkeyuser = $('#pvkey').val();
	try {
		var privateKey = bitcore.PrivateKey.fromWIF(pvkeyuser);
	}
	catch(err) {
		$('.output').text("Clé privée invalide");
		return;
	}
	var pubadr = privateKey.toAddress();
	redeemScript = bitcore.Script.empty()
		.add( bitcore.crypto.BN.fromNumber( 1514761200 ).toScriptNumBuffer())
		.add( 'OP_CHECKLOCKTIMEVERIFY' ).add('OP_DROP')
		.add( bitcore.Script.buildPublicKeyHashOut( pubadr ));
	p2shAddress = bitcore.Address.payingTo( redeemScript );
	document.getElementById("loading").remove();
	document.getElementById("gomove").style.display="none";
	getfee();
};
function toMB(nbsize){
	return nbsize/1000000;
}
function FilterArr(FArray,limit){
	var FilteredArray = FArray.filter(ArrEl=>ArrEl>limit);
	return FilteredArray.length
}
function call(data){
	var ranges = [  5,  10,  20,  30,  40,  50,  60,  70,  80,  90, 100, 120,
				  140, 160, 180, 200, 220, 240, 260, 280, 300, 350, 400, 450,
				  500, 550, 600, 650, 700, 750, 800, 850, 900, 950,1000];
	var TxSizeArray = data[data.length-1][2].map(toMB);
	var feeArrSlow = FilterArr(TxSizeArray,8); // Fast: 1, Norm: 4
	feeSlow = ranges[feeArrSlow];
	txfee = Math.ceil(80*256);
	outputtx = 50000 - txfee;
	if (outputtx < 10000){
		$('.output').text("Fees réseau Bitcoin trop elevées");
		alert("Désolé, les fees du réseau Bitcoin sont trop elevées pour vous permettre de retirer les fonds de votre Bitcoin Souvenir.");
		return;
	}
	destaddrfunds = $('#toaddr').val();
	var txtconf = "  >> CONFIRMATION <<";
	txtconf += "\nDépense du Bitcoin Souvenir";
	txtconf += "\n "+p2shAddress;
	txtconf += "\n 0,0005 BTC";
	txtconf += "\n\nTx vers "+destaddrfunds;
	txtconf += "\n Montant : "+outputtx/1e8+" BTC";
	txtconf += "\n Fees    : "+txfee/1e8+" BTC";
	if (confirm(txtconf) == true) {
		console.log("You pressed OK!");
		GetUtxo();
	} else {
			$('.output').text("Opération annulé par l'utilisateur");
	}
}
function getfee(){
	$.ajax({
		url: "https://core.jochen-hoenicke.de/queue/8h.js",
		type: "GET",
		cache: false,
		dataType: "script"
	}).fail(function (errorm,status) {
			console.log(errorm);
			console.log(status);
			$('.output').text("ERREUR Internet");
	});
}
function Move(){
	if (document.getElementById('pvkey').value.length > 0 ){
		$('#stopscan').hide();
		$('#gobut').hide();
		var privkey = $('#pvkey').val();
		var testfastWIF = privkey.startsWith("5");
		if (!testfastWIF){alert("Entrez ou scannez vore CLEF PRIVEE du Bitcoin Souvenir"); return};
		if (!/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/g.test($('#toaddr').val())){alert("Entrez une adresse de destination valide pour le dépenser"); return}; //
		$('.output').text("PATIENTEZ ...");
		setTimeout(redeem, 20);
	}
};
