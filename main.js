//Import libraries
var http = require('http'),
	rest = require('restler'),
	AT = '',
	RT = '',
    notificationCounter = 0;

//Set forwarding URLs based on API keys
var urls = new Object();
//Java RESTful Singlepay app
urls['07eb5df56b5155df839562f1ee3bbe4e'] = 'https://code-api-att.com/r2javaPROD/Payment/Java/app1/listener.jsp';
//Java RESTful Subscription app
urls['5071549040a40e61d74ee383f4ad9973'] = 'https://code-api-att.com/r2javaPROD/Payment/Java/app2/listener.jsp';
//Ruby RESTful Singlepay app
urls['1a4c0b58c1d89ae8f9de7845406bce13'] = 'xxxxxxxxxx';
//Ruby RESTful Subscription app
urls['c934bd6978e37e21a79dca30adff8ed2'] = 'xxxxxxxxxx';
//PHP RESTful Singlepay app
urls['b8344b66083a4bc6d705502f9b0b9d6a'] = 'xxxxxxxxxx';
//PHP RESTful Subscription app
urls['cc3bee4c5d29f14336af9837edf4d2f9'] = 'xxxxxxxxxx';
//VB RESTful Singlepay app
urls['feedab392ea926f41d6a4ccc2408427c'] = 'xxxxxxxxxx';
//VB RESTful Subscription app
urls['01fb201396c7b0b0148be4337f64a31d'] = 'xxxxxxxxxx';
//C# RESTful Singlepay app
urls['e1745ae95cfa72e5150446773be67ed1'] = 'xxxxxxxxxx';
//C# RESTful Subscription app
urls['f4472056c599cb3f26645bee587fa5af'] = 'xxxxxxxxxx';
//Java SDK Singlepay app
urls['8a4cd545cc85f32a5be86fcfb3ae1b3e'] = 'xxxxxxxxxx';
//Java SDK Subscription app
urls['8a4cd545cc85f32a5be86fcfb3ae1b3e'] = 'xxxxxxxxxx';
//Ruby SDK Singlepay app
urls['251ded4ae6f8c5c07a8711785e31d52b'] = 'xxxxxxxxxx';
//Ruby SDK Subscription app
urls['251ded4ae6f8c5c07a8711785e31d52b'] = 'xxxxxxxxxx';
//PHP SDK Singlepay app
urls['c677eddedbf979f4dc296a297257fa28'] = 'xxxxxxxxxx';
//PHP SDK Subscription app
urls['c677eddedbf979f4dc296a297257fa28'] = 'xxxxxxxxxx';
//VB SDK Singlepay app
urls['78c14458b5fda6872e2bab26a690f6e2'] = 'xxxxxxxxxx';
//VB SDK Subscription app
urls['fea4c7d2e4e90023a934c7ba589e7111'] = 'xxxxxxxxxx';
//C# SDK Singlepay app
urls['1a8064bc9b9ef2e8d2d734e7aad01dd3'] = 'xxxxxxxxxx';
//C# SDK Subscription app
urls['25ee829decc714a0c829d17742a347ae'] = 'xxxxxxxxxx';


//Function for refreshing the access token
function refreshToken(timeToWait) {
	setTimeout(function() {
		console.log(new Date() + ' Refreshing access token');
		rest.post('https://api.att.com/oauth/token', {
			data: {
				"client_id": "3c851c56952d91171c634e63c64d22ea",
				"client_secret": "21a5e116495c396d",
				"grant_type": "refresh_token",
				"refresh_token": RT
			}
		}).on('complete', function(data, response) {
			if (response.statusCode == 200) {
				AT = data.access_token;
				RT = data.refresh_token;
				console.log(new Date() + ' Refreshed and got access token ' + AT);
				refreshToken(6000);
			}
			else {
				console.log(new Date() + '' + data);
				refreshToken(600);
			}
		});
	}, timeToWait * 1000);
}

//Get an access token and keep it alive by refreshing every 6000 seconds, since it expires after 7199 seconds
console.log(new Date() + ' Getting access token');
rest.post('https://api.att.com/oauth/token', {
	data: {
		"client_id": "3c851c56952d91171c634e63c64d22ea",
		"client_secret": "21a5e116495c396d",
		"grant_type": "client_credentials",
		"scope": "PAYMENT"
	}
}).on('complete', function(data, response) {
	if (response.statusCode == 200) {
		AT = data.access_token;
		RT = data.refresh_token;
		console.log(new Date() + ' Got access token ' + AT);
		refreshToken(6000);
	}
	else {
		console.log(new Date() + '' + data);
	}
});

//Create server and listen for notifications to arrive, main logic is here
http.createServer(function(req, res) {
	var bodyarr = []
	req.on('data', function(chunk) {
		bodyarr.push(chunk);
	})
	req.on('end', function() {
		var dataReceived = bodyarr.join('');
		if (dataReceived.split('<hub:notificationId>')[1]) {
			var notificationId = dataReceived.split('<hub:notificationId>')[1].split('</hub:notificationId>')[0];
            notificationCounter += 1;
            var p = notificationCounter;
            console.log(p);
			console.log(new Date() + ' Received notification(' + p + ') ID: ' + notificationId);
			res.end('Thanks for the notification ID!');
			console.log(new Date() + ' Getting notification(' + p + ')');
			rest.get('https://api.att.com/Commerce/Payment/Rest/2/Notifications/' + notificationId + '?access_token=' + AT).on('complete', function(data, response) {
				if (data.IsSuccess == true) {
					var a = data.GetNotificationResponse
                    var SuccesfulRefund = 'SuccesfulRefund';
                    var CancelSubscription = 'CancelSubscription';
					if (a.NotificationType == SuccesfulRefund) {
						var OriginalTransactionId = a.OriginalTransactionId;
						console.log(new Date() + ' It was a refund notification(' + p + '), now getting transaction status to obtain API key of correct app');
						rest.get('https://api.att.com/Commerce/Payment/Rest/2/Transactions/TransactionId/' + OriginalTransactionId + '?access_token=' + AT).on('complete', function(data, response) {
                            if (data.IsSuccess = 'true') {
								var APIkey = data.MerchantApplicationId;
								console.log(new Date() + ' Forwarding notification(' + p + ') to ' + urls[APIkey]);
								rest.post(urls[APIkey], {
									data: dataReceived
								}).on('complete', function(data, response) {
									if (response.statusCode == 200) {
										console.log(new Date() + '' + data);
									}
									else {
										console.log(new Date() + ' Status code for forwarding notification(' + p + ') was ' + response.statusCode);
									}
								});
							}
							else {
								console.log(new Date() + '' + data);
							}
						});
					}
					else if ((a.NotificationType == "StopSubscription") || (a.NotificationType == CancelSubscription) || (a.NotificationType == "RestoreSubscription")) {
						var MerchantSubscriptionId = a.MerchantSubscriptionId;
						var ConsumerId = a.ConsumerId;
						console.log(new Date() + ' It was a ' + a.NotificationType + ' notification(' + p + '), now getting subscription details to obtain original transaction ID');
                        var headers = new Object();
                        headers.Accept = 'application/xml';
						rest.get('https://api.att.com/Commerce/Payment/Rest/2/Subscriptions/' + MerchantSubscriptionId + '/Detail/' + ConsumerId + '?access_token=' + AT, headers).on('complete', function(data, response) {
//							if (data.IsSuccess = 'true') {
//                                var OriginalTransactionId = data.OriginalTransactionId;
//								console.log(new Date() + ' Now getting transaction(' + p + ') status to obtain API key of correct app');
//								rest.get('https://api.att.com/Commerce/Payment/Rest/2/Transactions/TransactionId/' + OriginalTransactionId + '?access_token=' + AT).on('complete', function(data, response) {
//									if (data.IsSuccess = 'true') {
//										var APIkey = data.MerchantApplicationId;
//										console.log(new Date() + ' Forwarding notification(' + p + ') to ' + urls[APIkey]);
//										rest.post(urls[APIkey], {
//											data: b
//										}).on('complete', function(data, response) {
//											if (response.statusCode == 200) {
//												console.log(new Date() + '' + data);
//											}
//											else {
//												console.log(new Date() + ' Status code for forwarding notification(' + p + ') was ' + response.statusCode);
//											}
//										});
//									}
//									else {
//										console.log(new Date() + '' + data);
//									}
//								});
//							}
//							else {
                                console.log(JSON.stringify(data));
//							}
						});
					}
					else {
						console.log(new Date() + '' + data);
					}
				}
				else {
					console.log(new Date() + '' + data);
				}
			});
		}
		else {
			console.log(new Date() + ' Received unrecognized request from ' + req.remoteAddress + ' with these headers: ' + req.headers);
			res.end('Nothing to see here, stop making requests or else we will track you down.');
		}
	})
}).listen(80, '0.0.0.0');

console.log(new Date() + ' Started up successfully.');