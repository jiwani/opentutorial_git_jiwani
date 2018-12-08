'use strict';

const { WebhookClient, Payload, RichResponse, PLATFORMS } = require('dialogflow-fulfillment');
const { Card, Suggestion, Text } = require('dialogflow-fulfillment');


const express = require('express');
const bodyParser = require('body-parser');
const request = require('request-promise-native');


const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//api 호출 함수//
//query_options(service,uri,method,body,bearer_key)
//우선적으로 method도 입력 받게끔 수정함. - 박기철
//test
function query_options(service, uri, method, body, bearer_key) {
    var method_get = 'GET';
    var method_post = 'POST';

    let options_post = {
        uri: uri,
        method: method,
        body: body,
        headers: { 'content-type': 'application/json' },
        auth: {
            bearer: bearer_key
        },
        json: true
    };

    let options_get = {
        uri: uri,
        method: method,
        qs: body,
        headers: { 'content-type': 'application/json' },
        auth: {
            bearer: bearer_key
        },
        json: true
    };

    if (method == method_get)
        return options_get;
    else if (method == method_post)
        return options_post;
}


function welcome(agent) {
    agent.add(`Welcome to Express.JS webhook!`);
}

function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
}

function simpleInGetCostMonth(agent) {

    const dateTime = agent.parameters['date-time'];
    const kindOfClouds = agent.parameters['pKindOfClouds'];
    agent.add('네, 문의하신 ' + dateTime + ' +' + kindOfClouds + ' 비용은 $30,00원 입니다. 상세 비용 확인을 원하시나요?');

    agent.add(new Suggestion('상세 비용 페이지로 이동해줘'));
}


/*  
 **author : mjw
 **desc : 비용계산
 */

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function dateFormat(x) {
    x = x.replace(/-/g, '');
    if (x.length == 6) return x.substr(0, 4) + '-' + x.substr(4, 2);
    if (x.length == 8) return x.substr(0, 4) + '-' + x.substr(4, 2) + '-' + x.substr(6, 2);
}

const session_bearer_key = '7d46ba93-31f1-4eaa-b584-2df30a27d621';
//var getCostByTerm = function(agent) {
//    const dateTime = agent.parameters['date-time']; // 기간
//    const vendor = agent.parameters['vendor']; // 제품
//    const account = agent.parameters['account']; // 어카운트
//    const cost = agent.parameters['cost']; // 어카운트
//    const monthly = agent.parameters['monthly']; // 월별
//    const sort = agent.parameters['sort']; //
//    const display = agent.parameters['display']; // 월별
//
//    console.log('dateTime:' + dateTime);
//    console.log('vendor:' + vendor);
//    console.log('account:' + account);
//    console.log('cost:' + cost);
//    console.log('monthly:' + monthly);
//    console.log('sort:' + sort);
//    console.log('display:' + display);
//
//    let dateArg = dateTime.substr(0, 10).replace(/-/g, '');
//    if (monthly != '' && monthly != undefined) {
//        dateArg = dateArg.substr(0, 6);
//
//        return new Promise(function(resolve, reject) {
//            resolve(getCostByMonthly(agent, dateArg, vendor));
//        });
//    } else {
//        if (dateTime.indexOf("/") > -1) { // 기간으로 조회
//            dateArg = dateArg.substr(0, 6);
//
//            return new Promise(function(resolve, reject) {
//                resolve(getCostByMonth(agent, dateArg, vendor));
//            });
//        } else { // 일자로 조회
//            return new Promise(function(resolve, reject) {
//                resolve(getCostByDay(agent, dateArg, vendor));
//            });
//        }
//    }
//};

var getCostByMonth = function(agent) {
    getAccountId(agent)
        //    .then(function(result){
        //    	console.log('result:' + JSON.stringify(result));
        ////    	return getCost(agent);
        //    })
    ;
};
var getAccountId = function(agent) {

    const kindOfClouds = agent.parameters['kindOfClouds'];
    const dateTime = agent.parameters['date-time'];
    const costTerm = agent.parameters['cost'];

    agent.add(kindOfClouds + ' 계정에 account id 가 2개가 존재합니다. 원하시는 계정을 마우스로 선택하세요(또는 숫자 입력).');

    const accountInfo = { '1': '23sdjsfhu34t-2342u4234-ddd', '2': '348583485-sd9239232322' };
    agent.context.set({
        'name': 'app1',
        'lifespan': 1,
        'parameters': {
            'accountInfo': accountInfo,
            'dateTime': dateTime,
            'kindOfClouds': kindOfClouds,
            'costTerm': costTerm
        }
    });

    const googlePayloadJson = {

        "type": "list_card",
        "platform": "google",
        "title": "어카운트 리스트",
        "subtitle": "aws1 sub",
        "items": [{
                "optionInfo": {
                    "key": "1번",
                    "synonyms": []
                },
                "title": "Account-ID #1 : 23sdjsfhu34t-2342u4234-ddd",
                "image": {
                    "url": "http://www.boylesoftware.com/blog/wp-content/uploads/2015/04/checkmark.png",
                    "accessibilityText": "item image access 1"
                }
            },
            {
                "optionInfo": {
                    "key": "2번",
                    "synonyms": []
                },
                "title": "Account-ID #2 : 348583485-sd9239232322",
                "image": {
                    "url": "http://www.boylesoftware.com/blog/wp-content/uploads/2015/04/checkmark.png",
                    "accessibilityText": "item image access 2"
                }
            }
        ]

    };

    let payload = new Payload('ACTIONS_ON_GOOGLE', {});
    payload.setPayload(googlePayloadJson);
    agent.add(payload);
}

var getCostByMonAccId = function(agent) {
    console.log("요기");

    const app1 = agent.context.get('app1');
    console.log("app1", app1);

    const dateTime = app1.parameters.dateTime; // 기간
    const kindOfClouds = app1.parameters.kindOfClouds; // 제품
    const costTerm = app1.parameters.costTerm; // 제품
    const number = agent.parameters['number'];

    console.log('cost - dateTime:' + dateTime);
    console.log('cost - kindOfClouds:' + kindOfClouds);
    console.log('cost - costTerm:' + costTerm);
    console.log('cost - number:' + number);

    let dateArg = dateTime.substr(0, 10).replace(/-/g, '');
    if (dateTime.indexOf("/") > -1) { // 월로 조회
        dateArg = dateArg.substr(0, 6);
    }

    /*요청 바디 생성 시작.*/
    let service = 'cost'; //서비스 구분
    let uri = 'https://meteringdev.opsnow.com/MAZ/chatbot/cost/total'; //해당 인텐트 API URL
    let bearer_key = session_bearer_key; //해당 API 서버 토큰 값
    let method = 'POST';
    let body = {
        sitecode: 'BESPIN',
        uid: 'c40023d3-a870-4f53-8a16-e398526286ff',
        companyid: '1',
        vendorName: kindOfClouds,
        yyyymm: dateArg,
        account: null
    }

    let options = query_options(service, uri, method, body, bearer_key);

    console.log('options:' + JSON.stringify(options));

    return request(options).then(function(parsedBody) {
        console.log('parsedBody:' + JSON.stringify(parsedBody));
        /* 답변 생성 */
        let cost = parseFloat(parsedBody.Data[0].cost.toFixed(2));
        //        agent.add('[' + dateFormat(dateArg) + '] ' + kindOfClouds + ' ' + costTerm + '은 $' + numberWithCommas(cost) + '입니다.');

        console.log(app1); // prints null

        agent.add('알려드릴께요.<enter> [' + dateFormat(dateArg) + '] ' + ' 문의하신 ' + kindOfClouds + ', ' + '어카운트 ID : ' + app1.parameters.accountInfo[number] + '의 ' + costTerm + '은 $' + numberWithCommas(cost) + '입니다.');

        return Promise.resolve(agent);
    }).catch(function(err) {
        console.log('err:', err);
        console.log('error sentence1 :' + err.statusCode);
        console.log('error sentence2 :' + err.error.error);
        agent.add('값이 없습니다. 요청사항을 확인해 주세요.');
    });
}

var getCostByMonthly = function(agent, dateArg, vendor) {
    console.log('dateArg(month):' + dateArg);
    console.log('vendor:' + vendor);

    /*요청 바디 생성 시작.*/
    let service = 'cost'; //서비스 구분
    let uri = 'https://meteringdev.opsnow.com/MAZ/chatbot/cost/total'; //해당 인텐트 API URL
    let bearer_key = session_bearer_key; //해당 API 서버 토큰 값
    let method = 'POST';
    let body = {
        sitecode: 'BESPIN',
        uid: 'c40023d3-a870-4f53-8a16-e398526286ff',
        companyid: '1',
        vendorName: vendor,
        yyyymm: dateArg,
        account: null
    }

    let options = query_options(service, uri, method, body, bearer_key);

    console.log('options:' + JSON.stringify(options));

    return request(options).then(function(parsedBody) {
        console.log('parsedBody:' + JSON.stringify(parsedBody));
        /* 답변 생성 */
        agent.add(vendor + `의 월별 비용은 다음과 같습니다.`);
        agent.add(`1월의 비용: 100원`);
        agent.add(`2월의 비용: 110원`);
        agent.add(`3월의 비용: 120원`);
        agent.add(`4월의 비용: 130원`);
        agent.add(`5월의 비용: 140원`);
        agent.add(`6월의 비용: 150원....`);
        return Promise.resolve(agent);
    }).catch(function(err) {
        console.log('err:', err);
        agent.add('값이 없습니다. 요청사항을 확인해 주세요.');
    });
};

var getCostByYear = function(agent) {
    const dateTime = agent.parameters['date-time']; // 기간
    const vendor = agent.parameters['vendor']; // 제품
    const account = agent.parameters['account']; // 어카운트
    const cost = agent.parameters['cost']; // 어카운트
    const monthly = agent.parameters['monthly']; // 월별
    const sort = agent.parameters['sort']; //
    const display = agent.parameters['display']; // 월별

    console.log('year - dateTime:' + dateTime);
    console.log('year - vendor:' + vendor);
    console.log('year - account:' + account);
    console.log('year - cost:' + cost);
    console.log('year - monthly:' + monthly);
    console.log('year - sort:' + sort);
    console.log('year - display:' + display);

    let dateArg = dateTime.replace(/-/g, '');
    let sDate = '';
    let eDate = '';
    if (dateTime.indexOf("/") > -1) {
        sDate = dateArg[0];
        eDate = dateArg[1];
    }

    /*요청 바디 생성 시작.*/
    let service = 'cost'; //서비스 구분
    let uri = 'https://meteringdev.opsnow.com/MAZ/chatbot/cost/total'; //해당 인텐트 API URL
    let bearer_key = session_bearer_key; //해당 API 서버 토큰 값
    let method = 'POST';
    let body = {
        sitecode: 'BESPIN',
        uid: 'c40023d3-a870-4f53-8a16-e398526286ff',
        companyid: '1',
        vendorName: vendor,
        yyyymm: '201811',
        account: null
    }
    let options = query_options(service, uri, method, body, bearer_key);
    console.log('options:' + JSON.stringify(options));

    return request(options).then(function(parsedBody) {
        console.log('parsedBody:' + JSON.stringify(parsedBody));
        /* 답변 생성 */
        let cost = parseFloat(parsedBody.Data[0].cost.toFixed(2));
        //    	agent.add('[' + dateFormat(dateArg) +'] ' + vendor + ' ' + agent.parameters['cost'] + '은 $'+ numberWithCommas(cost) +'입니다.');
        agent.add('[' + dateTime + '] 1년간 ' + vendor + ' ' + agent.parameters['cost'] + '은 $' + numberWithCommas(cost) + '입니다(예문).');
        return Promise.resolve(agent);
    }).catch(function(err) {
        console.log('err:', err);
        agent.add('값이 없습니다. 요청사항을 확인해 주세요.');
    });
};


var simpleInGetIncidentList = function(agent) {

    agent.add(`인시던트 리스트를 보여드리겠습니다.`);

    /*요청 바디 생성 시작.*/
    let service = 'alertnow'; //서비스 임의 구분함. asset, cost, alertnow
    let uri = 'https://alertnowextapidqa.opsnow.com/chatbot/v1/1/incident'; //해당 인텐트 API URL
    //let bearer_key = 'b5e9b69f-6612-4ef8-bb36-397370f35339';					//해당 API 서버 토큰 값
    let bearer_key = 'e238895b-c199-4b02-a9a0-d915ef0d8546'; //해당 API 서버 토큰 값
    let method = 'GET';

    let params = {
        uid: '58dbd0c2-931a-4504-80c8-76edfcf3e45d',
        sitecode: 'BESPIN',
        startDt: '2018-11-22 00:00:00',
        endDt: '2018-11-23 23:59:59'
    }

    let options = query_options(service, uri, method, params, bearer_key);
    /*요청 바디 생성 끝.*/

    /* API request 요청 */
    return request(options).then(function(parsedBody) {

        /* 답변 생성 ,*/
        agent.add(`네, 인시던트 리스트 티켓 넘버는 ` + parsedBody.result[0].tcktNo + `입니다.`);
        console.log('Incident list ticket number = ' + parsedBody.result[0].tcktNo);

        return Promise.resolve(agent);
    }).catch(function(err) {
        console.log('err', err);
    });
    /* API request 끝 */

};

//
var simpleInGetCostdaily = function(agent) {

    const request = require('request-promise-native');
    const url = "https://api.site.com/sub?query=";

    agent.add(`일별 비용을 보여드리겠습니다. :`);

    return request.get('http://13.209.65.23:8080/customer')
        .then(jsonBody => {
            var body = JSON.parse(jsonBody);
            agent.add(new Card({
                title: body[0].username + `님의 일별 비용 `,
                text: body[0].dailycost + '원, 현재까지 사용한 결과입니다. ',
                buttonText: '자세히 보기',
                buttonUrl: 'http://hello.com'
            }));
            return Promise.resolve(agent);
        });

};

//   
function getServiceDesc(agent) {


}

//
function slotInGetServerStatus(agent) {

    const kindOfClouds = agent.parameters['pKindOfClouds'];

    if (kindOfClouds) {
        agent.add('전체 12대 ' + kindOfClouds + ' 서버의 CPU 사용률은 평균 98%, 메모리는 70%를 사용하고 있고, 서버별 사용률 편차는 65% 입니다. <enter> SEOUL-A-PRD-LIGHTSABER-NOTIFICATION-BATCH01 의 하드웨어 사용률이 높습니다. 지금 바로 확인하세요!');

        const googlePayloadJson_graph = {
            "type": "graph_bar",
            "platform": "google",
            "title": "서버 상태",
            "subtitle": "aws1 sub"
        };

        let payload = new Payload('ACTIONS_ON_GOOGLE', {});
        payload.setPayload(googlePayloadJson_graph);
        agent.add(payload);
    }

}


function slotInGetTotalServerPerfomance(agent) {


    agent.add('지난 한달(2018.09.20~2018.10.18) EC2서버 CPU, Memory, Disk 사용량 데이터를 분석한 결과, 10월 16일, 10월 18일 CPU 사용량이 한달 평균 표준편차의 30%이상 높습니다. 확인하시기 바랍니다.');
    agent.add('옵스나우 Asset Management 의 Performance 메뉴에서 전체 서버 성능을 확인할 수 있습니다.');

    const googlePayloadJson_graph = {
        "type": "graph_anal",
        "platform": "google",
        "title": "전체 서버 성능",
        "subtitle": "aws1 sub"
    };

    let payload = new Payload('ACTIONS_ON_GOOGLE', {});
    payload.setPayload(googlePayloadJson_graph);
    agent.add(payload);

}


function slotInGetDatabaseStatus(agent) {
    const kindOfClouds = agent.parameters['pKindOfClouds'];
    const time = agent.parameters['time'];

    agent.add('현재 ' + kindOfClouds + '데이터베이스의 평균 CPU 24%, 메모리는 70%를 사용하고 있습니다. 지금 바로 확인하세요!');

    agent.add(new Card({
        title: 'Asset Management - Performance',
        imageUrl: 'https://www.opsnow.com/assets/images/am_info_img01.png',
        text: '클라우드 서버의 CPU, 메모리, 디스크 사용률을 확인할 수 있습니다.',
        buttonText: '상세 페이지 이동',
        buttonUrl: 'https://asset.opsnow.com/#/performance/current'
    }));


}


function slotInGetDiskStatus(agent) {
    const kindOfClouds = agent.parameters['pKindOfClouds'];
    const time = agent.parameters['time'];

    agent.add('현재 ' + kindOfClouds + '서버의 디스크 사용률은 전체 480/540GB 사용중입니다.평균 88% 사용하고 있습니다. 지금 바로 확인하세요!');
    agent.add(new Card({
        title: 'Asset Management - Performance',
        imageUrl: 'https://www.opsnow.com/assets/images/am_info_img01.png',
        text: '클라우드 서버의 CPU, 메모리, 디스크 사용률을 확인할 수 있습니다.',
        buttonText: '상세 페이지 이동',
        buttonUrl: 'https://asset.opsnow.com/#/performance/current'
    }));

}

function simpleInGetAssetList(agent) {

    //   const dateTime = agent.parameters['date-time'];
    //  const kindOfAddOrDelete = agent.parameters['kindOfAddOrDelete'];
    //  const kindOfPastPeriod = agent.parameters['kindOfPastPeriod'];
    //const rs = agent.requestSource;
    //const os = agent.originalRequest;
    /*
        const googlePayloadJson = { 
            expectUserResponse: true, 
            isSsml: false,  
              
            noInputPrompts: [], 
            richResponse: { items: [{ simpleResponse: { textToSpeech: 'hello', displayText: 'hi' } }] }, 
            systemIntent: { intent: 'actions.intent.OPTION', } 
            
        } ;
      */
    /*
       const googlePayloadJson = { 
       "messages": 
          {
            "type": "simple_response",
            "platform": "google",
            "textToSpeech": "전체 클라우드 98개 Resource 에서 미사용 목록 2건이 검색되었습니다. 옵스나우 Asset Management 의 Resource Optimization 에서 다음 목록을 통해 예상 절감 금액 및 예상 증가 금액을 확인할 수 있습니다."
          }
      } ;
      */
    /*
        const googlePayloadJson =
          {
              
              "type": "list_card",
              "platform": "google",
              "title": "자산 내역 리스트",
              "subtitle": "aws1 sub",
              "items": [
                {
                  "optionInfo": {
                    "key": "key1",
                    "synonyms": []
                  },
                  "title": "AWS EC2 (50)",
                  "image": {
                    "url": "http://www.boylesoftware.com/blog/wp-content/uploads/2015/04/checkmark.png",
                    "accessibilityText": "item image access 1"
                  }
                },
                {
                  "optionInfo": {
                    "key": "key2",
                    "synonyms": []
                  },
                  "title": "AWS ELB (28)",
                  "image": {
                    "url": "http://www.boylesoftware.com/blog/wp-content/uploads/2015/04/checkmark.png",
                    "accessibilityText": "item image access 2"
                  }
                }
              ]

          };
             const googlePayloadJson_graph =
          {
              "type": "graph_pie",
              "platform": "google",
              "title": "자산 내역",
              "subtitle": "aws1 sub",
          };
        //  googlePayloadJson.messages.push(googlePayloadJson_graph);
        //    agent.requestSource = 'ACTIONS_ON_GOOGLE';
        //agent.add(new Payload('ACTIONS_ON_GOOGLE', googlePayloadJson )); 
     // agent.requestSource = 'ACTIONS_ON_GOOGLE';

        let payload = new Payload('ACTIONS_ON_GOOGLE', {}); 
        payload.setPayload(googlePayloadJson);
        agent.add(payload);

    */

    //  googlePayloadJson.messages.push(googlePayloadJson_graph);
    //    agent.requestSource = 'ACTIONS_ON_GOOGLE';
    //agent.add(new Payload('ACTIONS_ON_GOOGLE', googlePayloadJson )); 
    // agent.requestSource = 'ACTIONS_ON_GOOGLE';


    const kindOfAddOrDelete = agent.parameters['kindOfAddOrDelete'];
    const kindOfPastPeriod = agent.parameters['kindOfPastPeriod'];
    const itsAll = agent.parameters['itsAll'];
    if (itsAll) {
        agent.add('전체 자산내역을 확인하고 싶으신가요? <enter> 총 54개의 자원을 현재 사용중이고, 해당 내역은 다음과 같습니다.');

    } else if (kindOfPastPeriod !== null && kindOfAddOrDelete !== null) {
        agent.add(kindOfPastPeriod + ' ' + kindOfAddOrDelete + '자산내역을 확인하고 싶으신가요? <enter> 해당 내역은 다음과 같습니다.');

    } else {
        agent.add('전체 자산내역을 보여드리겠습니다. <enter> 총 54개의 자원을 현재 사용중이고, 해당 내역은 다음과 같습니다.');

    }

    const googlePayloadJson_graph = {

        "type": "graph_pie",
        "platform": "google",
        "title": "서버 상태",
        "subtitle": "aws1 sub"

    };

    /*
        [
        {
          "type": "simple_response",
          "platform": "google",
          "textToSpeech": "혹시 옵스나우 이용에 불편이 있으셨나요? 옵스나우 지원센터에서 서비스 담당자들에게 직접 질문을 등록하고 답변을 받을 수 있습니다."
        },
        {
          "type": "simple_response",
          "platform": "google",
          "textToSpeech": "가끔은 저도 제 고민을 들어줄 사람이 있으면 좋겠네요.."
        },
        {
          "type": "link_out_chip",
          "platform": "google",
          "destinationName": "상담/문의",
          "url": "https://support.opsnow.com/hc/ko/requests/new"
        },
        
    */

    let payload = new Payload('ACTIONS_ON_GOOGLE', {});
    payload.setPayload(googlePayloadJson_graph);
    agent.add(payload);



    // agent.add('현재 자산내역은 다음과 같습니다.');


    agent.add(new Suggestion(
        '자산 내역 페이지로 이동해줘'
    ));
}



function simpleInCheckMyPlan(agent) {

    /*
         const city = agent.parameters['geo-city'];
     const time = agent.parameters['time'];
     const gotCity = city.length > 0;
     const gotTime = time.length > 0;

     if(gotCity && gotTime) {
         agent.add(`Nice, you want to fly to ${city} at ${time}.`);
     } else if (gotCity && !gotTime) {
         agent.add('Let me know which time you want to fly');
     } else if (gotTime && !gotCity) {
         agent.add('Let me know which city you want to fly to');
     } else {
         agent.add('Let me know which city and time you want to fly');
     }
       */

}



function simpleInGetCostOptimization(agent) {

    agent.add('옵스나우는 Usage, Performace, Cost 분석을 통해 RI 구매, 혹은 Right Sizing 이 필요한 Instance 들을 추천하는 기능을 제공하고 있습니다!. <enter>그리고 필요한 항목만을 검색할 수 있는 Intelligent Search 를 사용해보세요! ');

    const googlePayloadJson_graph = {

        "type": "graph_cost_anal",
        "platform": "google",
        "title": "비용 분석",
        "subtitle": "aws1 sub"

    };
    agent.add('저도 간단하지만 강력한 비용 분석을 할 수 있어요! 저에게 고객님의 비용 분석을 맡겨보시겠어요?');

    let payload = new Payload('ACTIONS_ON_GOOGLE', {});
    payload.setPayload(googlePayloadJson_graph);
    agent.add(payload);

    agent.add(new Suggestion('상세 비용 페이지로 이동해줘'));
}


function simpleInGetCostMonth(agent) {
    //graph_cost_anal

    const dateTime = agent.parameters['date-time'];
    const kindOfClouds = agent.parameters['pKindOfClouds'];

    agent.add('네, 문의하신 ' + dateTime + ' +' + kindOfClouds + ' 비용은 $30,00원 입니다. 상세 비용 확인을 원하시나요?');


    agent.add(new Suggestion(
        '상세 비용 페이지로 이동해줘'
    ));

}


function simpleInGetCostMonthly(agent) {

    agent.add('네, 월별로 전체 금액을 보여드릴게요! ');

    const googlePayloadJson_graph = {

        "type": "graph_cost_month",
        "platform": "google",
        "title": "월별 비용",
        "subtitle": "aws1 sub"

    };

    let payload = new Payload('ACTIONS_ON_GOOGLE', {});
    payload.setPayload(googlePayloadJson_graph);
    agent.add(payload);

    agent.add('세부 항복별 비교도 준비하고 있습니다. 상세 비용을 확인하고 싶으시면 Cost Management 비용관리에서 확인하실 수 있습니다.');
    agent.add(new Suggestion('상세 비용 페이지로 이동해줘'));

}


function testGetCost(agent) {

    const kindOfClouds = agent.parameters['kindOfClouds'];
    const dateTime = agent.parameters['date-time'];

    agent.add(dateTime + '네 ' + kindOfClouds + '해당 계정에 account id 가 2개가 존재합니다. 원하시는 계정을 마우스로 선택하세요. 또는 첫번째 어카운트 보여줘, 두번째꺼 등등,,');

    const accountInfo = { '1': '23sdjsfhu34t-2342u4234-ddd', '2': '348583485-sd9239232322' };

    //해당 tttest
    agent.context.set({ 'name': 'app1', 'lifespan': 1, 'parameters': accountInfo });


    const googlePayloadJson = {

        "type": "list_card",
        "platform": "google",
        "title": "어카운트 리스트",
        "subtitle": "aws1 sub",
        "items": [{
                "optionInfo": {
                    "key": "1번",
                    "synonyms": []
                },
                "title": "Account-ID #1 : 23sdjsfhu34t-2342u4234-ddd",
                "image": {
                    "url": "http://www.boylesoftware.com/blog/wp-content/uploads/2015/04/checkmark.png",
                    "accessibilityText": "item image access 1"
                }
            },
            {
                "optionInfo": {
                    "key": "2번",
                    "synonyms": []
                },
                "title": "Account-ID #2 : 348583485-sd9239232322",
                "image": {
                    "url": "http://www.boylesoftware.com/blog/wp-content/uploads/2015/04/checkmark.png",
                    "accessibilityText": "item image access 2"
                }
            }
        ]

    };

    let payload = new Payload('ACTIONS_ON_GOOGLE', {});
    payload.setPayload(googlePayloadJson);
    agent.add(payload);

}



function testGetCostByMonth(agent) {

    const number = agent.parameters['number'];
    const app1 = agent.context.get('app1');

    console.log(app1); // prints null
    //console.log(app1.parameters[number]); // prints null
    //console.log(app1.parameters['date-time']); // prints null

    agent.add('네, 선택하신 ' + number + '번의 ' + '문의하신 어카운트 ID : ' + app1.parameters[number] + '의 ' + app1.parameters['date-time'] + ' 비용은 $30,00원 입니다.');

}




function convertDateTimetoString(objDate) {

    var result_date = objDate.getFullYear() + "-"
    result_date += (objDate.getMonth() + 1) + "-";
    result_date += objDate.getDate();

    var result_time = objDate.getHours() + ":"
    result_time += objDate.getMinutes() + ":";
    result_time += objDate.getSeconds();

    var result_date_time = result_date + " " + result_time;

    return result_date_time;
}

function getTimePeriod(time_period_case) {
    var currentDate = new Date();
    var startDate = new Date();
    var endDate = new Date();
    var cur_date_msec = currentDate.getTime();
    const millisec = 1000,
        aday_sec = 24 * 3600;

    let time_period = {
        startDt: '1970-01-01 00:00:00',
        endDt: '1970-01-01 23:59:59'
    };

    time_period.endDt = convertDateTimetoString(currentDate);

    switch (time_period_case) {
        case 'from_today': // 오늘
            startDate.setFullYear(currentDate.getFullYear());
            startDate.setMonth(currentDate.getMonth());
            startDate.setDate(currentDate.getDate());
            startDate.setHours(0);
            startDate.setMinutes(0);
            startDate.setSeconds(0);
            time_period.startDt = convertDateTimetoString(startDate);
            break;

        case 'from_yesterday': // 어제
        case 'from_yesterday2': // 그제
            if (time_period_case == 'from_yesterday')
                startDate.setTime(cur_date_msec - aday_sec * millisec);
            else if (time_period_case == 'from_yesterday2')
                startDate.setTime(cur_date_msec - 2 * aday_sec * millisec);
            startDate.setHours(0);
            startDate.setMinutes(0);
            startDate.setSeconds(0);
            time_period.startDt = convertDateTimetoString(startDate);

            endDate.setFullYear(startDate.getFullYear());
            endDate.setMonth(startDate.getMonth());
            endDate.setDate(startDate.getDate());
            endDate.setHours(23);
            endDate.setMinutes(59);
            endDate.setSeconds(59);
            time_period.endDt = convertDateTimetoString(endDate);
            break;

        case 'from_now': // 지금, 방금
        default:
            startDate.setTime(cur_date_msec - 5 * millisec); // 5sec 내외
            time_period.startDt = convertDateTimetoString(startDate);
            break;
    }

    console.log('start time is ' + time_period.startDt);
    console.log('end time is ' + time_period.endDt);

    return time_period;
}

var hIncidentInfoNow = function(agent) {
    var res_InciCount = 0;
    const req_kindOfIncident = agent.parameters['kindOfIncident'];
    const req_kindOfWhen = agent.parameters['kindOfWhen'];

    /*요청 바디 생성 시작.*/
    let service = 'alertnow'; //서비스 임의 구분함. asset, cost, alertnow
    let uri = 'https://alertnowextapidqa.opsnow.com/chatbot/v1/1/incident'; //해당 인텐트 API URL
    let bearer_key = 'e238895b-c199-4b02-a9a0-d915ef0d8546'; //해당 API 서버 토큰 값
    let method = 'GET';

    let params = {
        uid: '58dbd0c2-931a-4504-80c8-76edfcf3e45d',
        sitecode: 'BESPIN',
        startDt: '2018-11-22 00:00:00',
        endDt: '2018-11-23 23:59:59'
    };
    let time_period = {
        startDt: '1970-01-01 00:00:00',
        endDt: '1970-01-01 23:59:59'
    };

    time_period = getTimePeriod('from_now');
    params.startDt = time_period.startDt;
    params.endDt = time_period.endDt;

    let options = query_options(service, uri, method, params, bearer_key);
    /*요청 바디 생성 끝.*/

    /* API request 요청 */
    return request(options).then(function(parsedBody) {
        /* 답변 생성 */
        res_InciCount = parsedBody.result.length;
        agent.add(req_kindOfWhen + ` 발생한 ` + req_kindOfIncident + `는(은) 총` + res_InciCount + `개로 다음과 같습니다.`);
        agent.add(`인시던트 리스트의 첫번째 티켓 넘버는 ` + parsedBody.result[0].tcktNo + `입니다.`);

        console.log('Count of Incident list = ' + res_InciCount);
        console.log('1st ticket number of Incident list = ' + parsedBody.result[0].tcktNo);

        return Promise.resolve(agent);
    }).catch(function(err) {
        console.log('err', err);
    });
    /* API request 끝 */

};

var hIncidentInfoDay = function(agent) {
    var res_InciCount = 0;
    const req_kindOfIncident = agent.parameters['kindOfIncident'];
    const req_korWord_Day = agent.parameters['korWord_Day'];

    /*요청 바디 생성 시작.*/
    let service = 'alertnow'; //서비스 임의 구분함. asset, cost, alertnow
    let uri = 'https://alertnowextapidqa.opsnow.com/chatbot/v1/1/incident'; //해당 인텐트 API URL
    let bearer_key = 'e238895b-c199-4b02-a9a0-d915ef0d8546'; //해당 API 서버 토큰 값
    let method = 'GET';

    let params = {
        uid: '58dbd0c2-931a-4504-80c8-76edfcf3e45d',
        sitecode: 'BESPIN',
        startDt: '2018-11-22 00:00:00',
        endDt: '2018-11-23 23:59:59'
    };
    let time_period = {
        startDt: '1970-01-01 00:00:00',
        endDt: '1970-01-01 23:59:59'
    };

    if (req_korWord_Day == '오늘')
        time_period = getTimePeriod('from_today');
    else if (req_korWord_Day == '어제')
        time_period = getTimePeriod('from_yesterday');
    else if (req_korWord_Day == '그제')
        time_period = getTimePeriod('from_yesterday2');
    else {
        agent.add(`날짜를 이해 못 했어요. 지금 발생한 인시던트를  보여드리겠습니다.`);
        time_period = getTimePeriod('from_now');
    }

    params.startDt = time_period.startDt;
    params.endDt = time_period.endDt;

    let options = query_options(service, uri, method, params, bearer_key);
    /*요청 바디 생성 끝.*/

    /* API request 요청 */
    return request(options).then(function(parsedBody) {
        /* 답변 생성 */
        res_InciCount = parsedBody.result.length;
        agent.add(req_korWord_Day + ` 발생한 ` + req_kindOfIncident + `는(은) 총` + res_InciCount + `개로 다음과 같습니다.`);
        agent.add(`인시던트 리스트의 첫번째 티켓 넘버는 ` + parsedBody.result[0].tcktNo + `입니다.`);

        console.log('Count of Incident list = ' + res_InciCount);
        console.log('1st ticket number of Incident list = ' + parsedBody.result[0].tcktNo);

        return Promise.resolve(agent);
    }).catch(function(err) {
        console.log('err', err);
    });
    /* API request 끝 */

};


function WebhookProcessing(request, response) {
    const agent = new WebhookClient({ request, response });
    console.info(`agent set`);
    agent.requestSource = 'ACTIONS_ON_GOOGLE';


    console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
    console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

    let intentMap = new Map();

    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);
    intentMap.set('simple.in.getCost.month', simpleInGetCostMonth);
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);
    intentMap.set('simple.out.getServiceDesc', getServiceDesc);

    //cost
    intentMap.set('simple.in.getCost.daily', simpleInGetCostdaily);
    intentMap.set('simple.in.getCost.month', simpleInGetCostMonth);
    intentMap.set('simple.in.getCost.monthly', simpleInGetCostMonthly);

    intentMap.set('slot.in.getCostByMonth', getCostByMonth);
    intentMap.set('slot.in.getCostByMonth_accountId', getCostByMonAccId);
    intentMap.set('slot.in.getCostByYear', getCostByYear);


    //asset
    intentMap.set('slot.in.getServer.status', slotInGetServerStatus);
    intentMap.set('simple.in.checkMyPlan', simpleInCheckMyPlan);
    intentMap.set('slot.in.getTotalServer.perfomance', slotInGetTotalServerPerfomance);
    intentMap.set('slot.in.getDisk.status', slotInGetDiskStatus);
    intentMap.set('slot.in.getDatabase.status', slotInGetDatabaseStatus);
    intentMap.set('simple.in.getAsset.list', simpleInGetAssetList);


    //test
    intentMap.set('test.getCost', testGetCost);
    intentMap.set('test.getCost_byMonth', testGetCostByMonth);



    //alertnow
    intentMap.set('simple.in.getIncident.list', simpleInGetIncidentList);
    intentMap.set('simple.in.getCostOptimization', simpleInGetCostOptimization);

    intentMap.set('IncidentInfoNow', hIncidentInfoNow);
    intentMap.set('IncidentInfoDay', hIncidentInfoDay);

    agent.handleRequest(intentMap);
}


// Webhook
app.post('/', function(request, response) {
    console.info(`\n\n>>>>>>> S E R V E R   H I T <<<<<<<`);
    WebhookProcessing(request, response);
});

app.listen(8093, function() {
    console.info(`Webhook listening on port 8093!`)
});