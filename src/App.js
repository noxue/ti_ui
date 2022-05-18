
import { Layout, Card, Breadcrumb, Row, Col, Table } from 'antd';

import 'antd/dist/antd.css';
import './App.css';
import axios from 'axios';
import Excel from 'exceljs';
import { useState, useEffect } from 'react';

function decodeUnicode(str) {
  return str.replace(/\\u([\d\w]{4})/gi, function (match, grp) {
    return String.fromCharCode(parseInt(grp, 16));
  });
}

// const api_host = "http://ti.code.noxue.com"
const api_host = "http://127.0.0.1:3210"

const { Header, Footer, Sider, Content } = Layout;

const product_columns = [
  {
    title: '型号',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '备注',
    dataIndex: 'comment',
    key: 'comment',
    render: (text) => {
      return decodeUnicode(text);
    }
  },
  {
    title: '当前库存',
    dataIndex: 'count',
    key: 'count',
  },
  {
    title: '包装数量',
    dataIndex: 'pack_size',
    key: 'pack_size',
  },
  {
    title: '最小通知包装数',
    dataIndex: 'notice_size',
    key: 'notice_size',
  },
  {
    title: '优先级',
    dataIndex: 'rank',
    key: 'rank',
  },

];


const task_columns = [
  {
    title: '任务编号',
    dataIndex: 'task_id',
    key: 'name',
  },
  {
    title: '型号',
    dataIndex: ['product', 'name'],
    key: 'product_name',
  },
  {
    title: '任务创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    render: (text, record) => {
      // 时间戳转年月日时分秒
      var date = new Date(text * 1000);
      var Y = date.getFullYear() + '-';
      var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
      var D = date.getDate() + ' ';
      var h = date.getHours() + ':';
      var m = date.getMinutes() + ':';
      var s = date.getSeconds();
      return Y + M + D + h + m + s;
    }
  },
];

// 点击表单按钮，获取上传文件内容
async function getFile(e) {
  var file = e.target.files[0];
  var reader = new FileReader();
  reader.readAsArrayBuffer(file);
  reader.onload = function (e) {
    var data = e.target.result;
    var workbook = new Excel.Workbook();
    workbook.xlsx.load(data).then(function () {
      var worksheet = workbook.getWorksheet(1);
      var rowCount = worksheet.rowCount;
      var colCount = worksheet.columnCount;
      var data = [];
      for (var i = 1; i <= rowCount; i++) {

        // 出现空行，停止读取
        if (worksheet.getRow(i).getCell(1).value == null) {
          break;
        }

        var row = [];
        for (var j = 1; j <= colCount; j++) {
          row.push(worksheet.getCell(i, j).value);
        }
        data.push(row);
      }

      // 排除第一行，生成json
      var json = [];
      for (var i = 1; i < data.length; i++) {
        var obj = {};
        // 中文转unicode
        for (var j = 0; j < data[i].length; j++) {
          if (data[i][j] != null) {
            data[i][j] = (data[i][j] + "").replace(/[\u4e00-\u9fa5]/g, function (match) {
              return '\\u' + match.charCodeAt(0).toString(16);
            });

          }
        }
        console.log(data[i][1]);

        var obj = { name: (data[i][0] + "").trim(), comment: data[i][1], pack_size: parseInt(data[i][2]), notice_size: parseInt(data[i][3]) };
        json.push(obj);
      }
      console.log(json);
      console.log(data);

      // axios post json
      axios.post(api_host + '/products', json)
        .then(function (response) {
          console.log(response);
          alert("上传成功");
          // 刷新页面
          window.location.reload();
        })
        .catch(function (error) {
          alert("提交出错，请重新提交:" + error)
          window.location.reload();
          console.log(error);
        });

    });
  }
}


function App() {

  // 创建state
  const [products, setProducts] = useState([]);
  // tasks state
  const [tasks, setTasks] = useState([]);

  const [upload, setUpload] = useState(false);

  useEffect(() => {

    // 判断url参数是否有upload，如果有，则设置upload为true
    var url = window.location.href;
    var index = url.indexOf("?upload");
    if (index !== -1) {
      setUpload(true);
    }

    const timer = setInterval(() => {
      axios.get(api_host + '/products')
        .then(function (response) {
          console.log(response);
          setProducts(response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });


      axios.get(api_host + '/tasks')
        .then(function (response) {
          console.log(response);
          setTasks(response.data.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    }, 2000);
    return () => clearInterval(timer);

  }, [])

  return (
    <Layout className="layout">

      <Content style={{ padding: '0 50px' }}>
        <Breadcrumb style={{ margin: '16px 0' }}>
          <Breadcrumb.Item>芯片</Breadcrumb.Item>
          <Breadcrumb.Item>库存</Breadcrumb.Item>
          <Breadcrumb.Item>监控</Breadcrumb.Item>
        </Breadcrumb>
        {/* 获取上传文件内容 */}
        {
          upload ?
            <Row>
              <Col span={24}>
                <div>
                  设置要查询的产品：<input type="file" id="file" onChange={getFile} />
                </div>
              </Col>
            </Row> : ""
        }


        <Row>
          <Col span={12}>

            <Card title="待查询的产品队列" bordered={false} style={{ margin: 10 }}>
              <Table columns={product_columns} dataSource={products} pagination={false} size="small" />
            </Card>
          </Col>

          <Col span={12}>
            <Card title="正在查询的产品列表" bordered={false} style={{ margin: 10 }}>
              <Table columns={task_columns} dataSource={tasks} pagination={false} size="small" />


            </Card>
          </Col>
        </Row>
      </Content>
      <Footer style={{ textAlign: 'center' }}>Ant Design ©2018 Created by Ant UED</Footer>
    </Layout>

  );
}

export default App;
