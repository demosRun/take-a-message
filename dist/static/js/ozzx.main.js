"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

// 对象合并方法
function assign(a, b) {
  var newObj = {};

  for (var key in a) {
    newObj[key] = a[key];
  }

  for (var key in b) {
    newObj[key] = b[key];
  }

  return newObj;
} // 运行页面所属的方法


function runPageFunction(pageName, entryDom) {
  // ozzx-name处理
  window.ozzx.domList = {};
  pgNameHandler(entryDom); // 判断页面是否有自己的方法

  var newPageFunction = window.ozzx.script[pageName];
  if (!newPageFunction) return; // console.log(newPageFunction)
  // 如果有created方法则执行

  if (newPageFunction.created) {
    // 注入运行环境
    newPageFunction.created.apply(assign(newPageFunction, {
      $el: entryDom,
      data: newPageFunction.data,
      activePage: window.ozzx.activePage,
      domList: window.ozzx.domList
    }));
  } // 判断页面是否有下属模板,如果有运行所有模板的初始化方法


  for (var key in newPageFunction.template) {
    var templateScript = newPageFunction.template[key];

    if (templateScript.created) {
      // 获取到当前配置页的DOM
      // 待修复,临时获取方式,这种方式获取到的dom不准确
      var domList = entryDom.getElementsByClassName('ox-' + key);

      if (domList.length !== 1) {
        console.error('我就说会有问题吧!');
        console.log(domList);
      } // 为模板注入运行环境


      templateScript.created.apply(assign(newPageFunction.template[key], {
        $el: domList[0].children[0],
        data: templateScript.data,
        activePage: window.ozzx.activePage,
        domList: window.ozzx.domList
      }));
    }
  }
} // ozzx-name处理


function pgNameHandler(dom) {
  // 遍历每一个DOM节点
  for (var i = 0; i < dom.children.length; i++) {
    var tempDom = dom.children[i]; // 判断是否存在@name属性

    var pgName = tempDom.attributes['@name'];

    if (pgName) {
      // console.log(pgName.textContent)
      // 隐藏元素
      tempDom.hide = function () {
        this.style.display = 'none';
      };

      window.ozzx.domList[pgName.textContent] = tempDom;
    } // 判断是否有点击事件


    var clickFunc = tempDom.attributes['@click'];

    if (clickFunc) {
      tempDom.onclick = function (event) {
        var clickFor = this.attributes['@click'].textContent; // 判断页面是否有自己的方法

        var newPageFunction = window.ozzx.script[window.ozzx.activePage]; // console.log(this.attributes)
        // 判断是否为模板

        var templateName = this.attributes['template']; // console.log(templateName)

        if (templateName) {
          newPageFunction = newPageFunction.template[templateName.textContent];
        } // console.log(newPageFunction)
        // 取出参数


        var parameterArr = [];
        var parameterList = clickFor.match(/[^\(\)]+(?=\))/g);

        if (parameterList && parameterList.length > 0) {
          // 参数列表
          parameterArr = parameterList[0].split(','); // 进一步处理参数

          for (var i = 0; i < parameterArr.length; i++) {
            var parameterValue = parameterArr[i].replace(/(^\s*)|(\s*$)/g, ""); // console.log(parameterValue)
            // 判断参数是否为一个字符串

            if (parameterValue.charAt(0) === '"' && parameterValue.charAt(parameterValue.length - 1) === '"') {
              parameterArr[i] = parameterValue.substring(1, parameterValue.length - 1);
            }

            if (parameterValue.charAt(0) === "'" && parameterValue.charAt(parameterValue.length - 1) === "'") {
              parameterArr[i] = parameterValue.substring(1, parameterValue.length - 1);
            } // console.log(parameterArr[i])

          }

          clickFor = clickFor.replace('(' + parameterList + ')', '');
        } else {
          // 解决 @click="xxx()"会造成的问题
          clickFor = clickFor.replace('()', '');
        } // console.log(newPageFunction)
        // 如果有方法,则运行它


        if (newPageFunction[clickFor]) {
          // 绑定window.ozzx对象
          // console.log(tempDom)
          // 待测试不知道这样合并会不会对其它地方造成影响
          newPageFunction.$el = this;
          newPageFunction.$event = event;
          newPageFunction.domList = window.ozzx.domList;
          newPageFunction[clickFor].apply(newPageFunction, parameterArr);
        } else {
          // 如果没有此方法则交给浏览器引擎尝试运行
          eval(this.attributes['@click'].textContent);
        }
      };
    } // 递归处理所有子Dom结点


    if (tempDom.children.length > 0) {
      pgNameHandler(tempDom);
    }
  }
} // 便捷获取被命名的dom元素


function $dom(domName) {
  return ozzx.domList[domName];
} // 跳转到指定页面


function $go(pageName, inAnimation, outAnimation, param) {
  ozzx.state.animation = {
    in: inAnimation,
    out: outAnimation
  };
  var paramString = '';

  if (param && _typeof(param) == 'object') {
    paramString += '?'; // 生成URL参数

    for (var paramKey in param) {
      paramString += paramKey + '=' + param[paramKey] + '&';
    } // 去掉尾端的&


    paramString = paramString.slice(0, -1);
  }

  window.location.href = paramString + "#" + pageName;
} // 页面资源加载完毕事件


window.onload = function () {
  var page = ozzx.entry;
  window.ozzx.activePage = page; // 更改$data链接

  $data = ozzx.script[page].data;
  var entryDom = document.getElementById('ox-' + page);

  if (entryDom) {
    runPageFunction(page, entryDom);
  } else {
    console.error('找不到页面入口!');
  }
};

window.ozzx = {
  script: {
    "home": {
      "data": {},
      "created": function created() {
        var screen = ozzx.tool.getScreenInfo();

        if (screen.ratio < 1) {
          $dom('mainBox').classList.add('min');
        }
      },
      "template": {
        "banner": {
          "created": function created() {
            var screen = ozzx.tool.getScreenInfo();
            console.log(screen.ratio); // 判断横屏还是竖屏

            if (screen.ratio > 1) {
              $dom('bannerBox').style.height = screen.clientWidth * 0.459 + 'px';
            } else {
              $dom('bannerBox').classList.add('min');
              console.log(screen.clientWidth * 1.05);
              $dom('bannerBox').style.height = screen.clientWidth * 1.05 + 30 + 'px';
            }
          }
        },
        "tagCloud": {
          "created": function created() {
            var screenWidth = ozzx.tool.getScreenInfo().clientWidth; // 最大宽度800

            if (screenWidth > 1000) screenWidth = 800;
            document.getElementById('myCanvas').width = screenWidth;
            document.getElementById('myCanvas').height = screenWidth * 0.6;
            document.getElementById('myCanvasContainer').style.height = screenWidth * 0.6 + 'px';
            TagCanvas.Start('myCanvas', 'tags', {
              weight: true,
              fadeIn: 1000,
              weightMode: 'both',
              textColour: '#ff0000',
              frontSelect: true,
              outlineColour: '#ff00ff',
              textHeight: 20,
              maxSpeed: 0.05,
              wheelZoom: false,
              stretchX: 1.8,
              dragControl: true
            });
          }
        },
        "messageBox": {
          "created": function created() {
            var html = ''; // 针对手机和PC分别进行处理

            var screen = ozzx.tool.getScreenInfo();

            if (screen.ratio > 1) {
              messageList.forEach(function (element) {
                html += "\n            <div class=\"message-item\"><div class=\"message-box-title\">".concat(element.name, "</div><div class=\"message-box-text\">").concat(element.data, "</div></div>\n          ");
              });
              html += '<div class="clear"></div>';
            } else {
              messageList.forEach(function (element) {
                html += "\n            <div class=\"left-item\">".concat(element.name, "</div>\n          ");
              });
              html += "\n          </div>\n          <div class=\"right-box\" id=\"messageBoxRightBox\">".concat(messageList[0].data, "</div>\n          <div class=\"clear\"></div>\n        ");
              var itemList = document.getElementsByClassName('left-item');
              setTimeout(function () {
                itemList[0].classList.add('active');
              }, 0);
              setTimeout(function () {
                var _loop = function _loop(ind) {
                  var element = itemList[ind];

                  element.onclick = function () {
                    for (var _ind = 0; _ind < itemList.length; _ind++) {
                      var _element = itemList[_ind];

                      _element.classList.remove('active');
                    }

                    this.classList.add('active');
                    document.getElementById('messageBoxRightBox').innerHTML = messageList[ind].data;
                  };
                };

                for (var ind = 0; ind < itemList.length; ind++) {
                  _loop(ind);
                }
              }, 1000);
            }

            $dom('messageBox').innerHTML = html;
          },
          "activeItem": function activeItem() {
            console.log(this);
          }
        },
        "swiper": {
          "data": {
            "mySwiper": null
          },
          "created": function created() {
            var screen = ozzx.tool.getScreenInfo();

            if (screen.ratio < 1) {
              $dom('swiperContainer').style.height = screen.clientWidth * 0.6 + 'px';
              $dom('swiperContainer').classList.add('min');
              this.data.mySwiper = new Swiper('.swiper-container', {
                autoplay: 3000,
                loop: true,
                // 禁用鼠标点击
                simulateTouch: false,
                onlyExternal: true,
                slidesPerView: 3,
                //其他设置
                tdFlow: {
                  rotate: 10,
                  stretch: 0,
                  depth: 200,
                  modifier: 1.4,
                  shadows: true
                }
              });
            } else {
              this.data.mySwiper = new Swiper('.swiper-container', {
                autoplay: 3000,
                loop: true,
                // 禁用鼠标点击
                simulateTouch: false,
                slidesPerView: 3,
                //其他设置
                tdFlow: {
                  rotate: 10,
                  stretch: 0,
                  depth: 400,
                  modifier: 1,
                  shadows: true
                }
              });
            }
          },
          "last": function last() {
            this.data.mySwiper.swipePrev();
          },
          "next": function next() {
            this.data.mySwiper.swipeNext();
          }
        },
        "footer": {
          "created": function created() {}
        }
      }
    },
    "titleBar": {},
    "copyright": {}
  },
  tool: {},
  entry: "home",
  state: {}
}; // 便捷的获取工具方法

var $tool = ozzx.tool;
var $data = {};

function switchPage(oldUrlParam, newUrlParam) {
  var oldPage = oldUrlParam.split('&')[0];
  var newPage = newUrlParam.split('&')[0]; // 查找页面跳转前的page页(dom节点)
  // console.log(oldUrlParam)
  // 如果源地址获取不到 那么一般是因为源页面为首页

  if (oldPage === undefined) {
    oldPage = ozzx.entry;
  }

  var oldDom = document.getElementById('ox-' + oldPage);

  if (oldDom) {
    // 隐藏掉旧的节点
    oldDom.style.display = 'none';
  } // 查找页面跳转后的page


  var newDom = document.getElementById('ox-' + newPage); // console.log(newDom)

  if (newDom) {
    // 隐藏掉旧的节点
    newDom.style.display = 'block';
  } else {
    console.error('页面不存在!');
    return;
  }

  window.ozzx.activePage = newPage; // 更改$data链接

  $data = ozzx.script[newPage].data;
  runPageFunction(newPage, newDom);
}
/**
* 获取屏幕信息
* @return {object} 屏幕信息
*/


ozzx.tool.getScreenInfo = function () {
  return {
    clientWidth: document.body.clientWidth,
    clientHeight: document.body.clientHeight,
    ratio: document.body.clientWidth / document.body.clientHeight,
    // 缩放比例
    devicePixelRatio: window.devicePixelRatio || 1
  };
};