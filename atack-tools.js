const cluster = require('cluster');
const http = require('http');

const numCPUs = require('os').cpus().length;

function factorial(n){
  let i =1;
  for(let t=n; t>0; t--){
    i*=t;
  }
  return i;
}

function minWeight(r,m) {
  return Math.pow(2,m-r);
}

function binNewton(n,k){
  return factorial(n)/factorial(n-k)/factorial(k);
}

function rowsDist(row1,row2){
  let dist = 0;
  for (let i=0;i<row1.length;i++){
    dist += ((row1[i]+row2[i])%2);
  }
  return dist;
}

function firstMWCodeWordinProj(arr,cols){
  let minWht = cols.length;
  let finalIdxs = [];
  for (let i=0;i<arr.length;i++){
    let curWht = 0;
    let idxs = [];
    for (let j in cols) {
      if (arr[i][cols[j]-1] === 1){
        ++curWht;
        if(curWht>minWht){
          break;
        }else{
          idxs.push(cols[j]);
        }
      }
    }
    if(curWht < minWht){
     minWht = curWht;
     finalIdxs = idxs.slice();
    }
  }
  return finalIdxs;
}


function firstMWCodeWord(arr,wht) {
  for (let i=0;i<arr.length;i++){
    let curWht = 0;
    let idxs = [];
    for (let j=0;j<arr[i].length;j++) {
      if (arr[i][j] === 1){
        ++curWht;
        if(curWht>wht){
          break;
        }else{
          idxs.push(j+1);
        }
      }
    }
    if(curWht === wht)
      return idxs;
  }
  return [];
}

function countRows(r,m){
  let sum = 0;
  for(let i=0;i<=r;i++)
    sum+=binNewton(m,i);
  return sum;
}

function rowsAdd(row1,row2){
  for(let j=0;j<row1.length;j++)
    row1[j] = (row1[j] + row2[j])%2;
}

function mulStrings(arr,len,nums){
  let res = [];
  for (let i=0;i<len;i++){
    res[i] = 1;
    for (let j=0;j<nums.length;j++){
      res[i] *= arr[nums[j]][i];
    }
  }
  return res;
}

function viewArray(arr){
  console.log('*********arr************************');
  let simpleArr='';
  for (let i=0;i<arr.length;i++) {
    if(arr[i].length) {
      let row = '';
      for (let j = 0; j < arr[i].length; j++)
        row += `${arr[i][j]} `;
      console.log(`| ${row}|`);
    }else{
      simpleArr += `${arr[i]} `
    }
  }
  if(simpleArr){
    console.log(`| ${simpleArr}|`);
  }
  console.log('*********arr/***********************');
}

function puncturedMatrix(mtrx, cols){
  let pMtrx = [];
  for (let i=0;i<mtrx.length;i++){
    pMtrx[i] = mtrx[i].slice(0,cols[0]);
    for (let j=1;j<cols.length;j++){
      pMtrx[i] = pMtrx[i].concat(mtrx[i].slice(cols[j-1]+1,cols[j]));
    }
    pMtrx[i] = pMtrx[i].concat(mtrx[i].slice(cols[cols.length-1]+1));
  }

  return pMtrx;
}

function selection(a,n,m){
  let k = m;
  for (let i = k - 1; i >= 0; --i)
    if (a[i] < n - k + i + 1) 
    {
      ++a[i];
      for (let j = i + 1; j < k; ++j)
        a[j] = a[j - 1] + 1;
      return true;
    }
  return false;
}

function partOfArr(len,arr){
  return arr.slice().splice(0,len);
}

function mixTheRows(arr,r,m,columns){
  let idx = 0;
  for (let j=2;j<=r;j++){
    let rr = [];
    for (let i=0;i<m;i++)
      rr[i]=i+1;
    arr[m-1+j+idx] = mulStrings(arr,columns,partOfArr(j,rr));
    while(selection(rr,m,j)){ 
      ++idx;
      arr[m-1+j+idx] = mulStrings(arr,columns,partOfArr(j,rr));
    }
  }
}

function colsNumber (m){
  return Math.pow(2,m);
}

function generatorMatrix(r,m){
  
  let arr = [];
  let columns = colsNumber(m);
  let rows = countRows(r,m);
  
  for (let n=0;n<rows;n++)
    arr[n] = [];
  for (let i=0;i<columns;i++){
    arr[0][i] = 1;
    let curr = i;
    for (let j=m;j>0;j--){
      arr[j][i] = curr%2;
      curr = Math.floor(curr/2);
    }
    
  }
  mixTheRows(arr,r,m,columns);
  // viewArray(arr);
  let proj = firstMWCodeWord(arr,minWeight(r,m));
  let puncColumns = firstMWCodeWordinProj(arr,proj);

  return arr;
}

function randomNum(first,last) {
  return Math.floor(Math.random() * (last - first)) + first;
}

function timeSpent(r, m){
  const start= new Date().getTime();
  let y1 = 0, lenArr = {};
  let fin = colsNumber(m)-1, CPUnum = numCPUs/2;

  const pqSigMatrix = pqsigRM(r, m);
  if (cluster.isMaster) {
    const messageHandler = (msg) => {
      let {len, col1, col2, pid } = msg;
      lenArr[col1].push(msg.len);
      if(!lenArr[col2])
        lenArr[col2] = [];
      lenArr[col2].push(msg.len);
      if(col2<fin) {
        cluster.workers[pid].send({col1: col1, col2: ++col2, id: pid});
      } else {
        for (let i in lenArr) {
          uniqueValues(lenArr[i]);
          lenArr[i] = unique(lenArr[i]);
          console.log(JSON.stringify(lenArr));
        }
        const end = new Date().getTime();
        console.log(`Time Spent on code part: ${Math.trunc((end - start)/1000)}.${(end - start)%1000}s `);
      }
    }

    for (let i = 0; i < CPUnum; i++) {
      cluster.fork();
    }

    for (let id in cluster.workers) {
      cluster.workers[id].on('message', messageHandler);
      lenArr[y1] = [];
      cluster.workers[id].send({col1: y1, col2: ++y1, id: id});
    }

    cluster.on('exit', (worker, code, signal) => {
      console.log(`worker ${worker.process.pid} died`);
    });

  } else {
    process.on('message', function(msg) {
      const { col1, col2, id } = msg;
      console.log(col1+' '+col2);
      let arr4 = gaussAlg(puncturedMatrix(pqSigMatrix, [col1,col2]));

      let arr5 = combineMtrxs(arr4, getDualCodeMtrx(arr4));
      arr5 = gaussAlg(arr5);
      process.send({ len: gaussAlg(getDualCodeMtrx(arr5)).length, col1: col1, col2: col2, pid: id});
    });
  }
}

function unique(arr) {
  return Array.from(new Set(arr));
}

function uniqueValues(arr) {
  let obj = {};
  for (let i in arr) {
    let idx = String(arr[i]);
    if (!(idx in obj)){
      obj[idx] = 0;
    }
    ++obj[idx];
  }
  console.log(obj);
}

function objPrettify (obj) {
  let newObj = {};
  let map = new Map(Object.entries(obj));
  let uniqueValues = unique(map.values());
  for (let i in uniqueValues) {
    let idx = '|';
    for (let j in obj) {
      if (obj[j]===uniqueValues[i]){
        idx += ` ${j} |`;
      }
    }
    newObj[idx] = uniqueValues[i];
  }

  return newObj;
}

function changeRows(mtrx,row1,row2) {
  for(let j=0;j<mtrx[0].length;j++){
    let temp = mtrx[row1][j];
    mtrx[row1][j] = mtrx[row2][j];
    mtrx[row2][j] = temp;
  }
}

function changeCols(mtrx,col1,col2) {
  for(let i=0;i<mtrx.length;i++){
    let temp = mtrx[i][col1];
    mtrx[i][col1] = mtrx[i][col2];
    mtrx[i][col2] = temp;
  }
}

function gaussAlg(arr){
  const diff = Math.abs(arr[0].length - arr.length);
  const len = arr[0].length - arr.length ? arr.length : arr[0].length;
  let cont;
  let counter;
  for(let j=0;j<len;j++){
    cont = -1;
    counter = 1;
    for(let i=j;i<len;i++){
      if(arr[i][j]){
        changeRows(arr,j,i);
        cont = i;
        break;
      }
    }
    while (cont === -1 && counter<diff){
      changeCols(arr,j,j+(counter++));
      for(let i=j;i<len;i++){
        if(arr[i][j]){
          changeRows(arr,j,i);
          cont = i;
          break;
        }
      }
    }
    if (cont !== -1)
      for (let i=cont+1;i<len;i++){
        if(arr[i][j]){
          rowsAdd(arr[i],arr[j]);
        }
      }
  }
  if (cont !== -1) {
    for (let j = len - 1; j > 0; j--) {
      for (let i = j - 1; i > -1; i--) {
        if (arr[i][j]) {
          rowsAdd(arr[i], arr[j]);
        }
      }
    }
  }else{
    for (let i=0;i<arr.length;i++){
      let flag = 0;
      for (let j = 0;j<arr[0].length;j++){
        flag += arr[i][j];
      }
      if (!flag) {
        arr = arr.slice(0,i);
        break;
      }
    }
  }
  return arr;
}

function getDualCodeMtrx(arr){
  let dArr = [];
  for (j = arr.length; j < arr[0].length; j++) {
    const cont = j-arr.length;
    dArr[cont] = [];
    for (let i = 0; i < arr.length; i++) {
      dArr[cont][i] = arr[i][j];
    }
    for (let i = arr.length;i<arr[0].length;i++){
      if(i !== j) {
        dArr[cont][i] = 0;
      } else {
        dArr[cont][i] = 1;
      }
    }
  }

  return dArr;
}

function combineMtrxs(m1,m2) {
  let m = [];
  for (let i=0;i<m1.length;i++){
    m[i] = m1[i];
  }
  for (let i=m1.length;i<m1.length + m2.length;i++){
    m[i] = m2[i-m1.length];
  }

  return m;
}

function pqsigRM(r,m){
  let firstRowMtrx = generatorMatrix(r,m-2);
  let STRowMtrx = generatorMatrix(r-1,m-2);
  let FrowMtrx = generatorMatrix(r-2,m-2);

  for (let i = 1;i<200;i++){
    changeCols(firstRowMtrx,i-1,i+1);
  }
  for (let i = 1;i<100;i++){
    changeCols(FrowMtrx,i-1,i+1);
  }

  let finMtrx = [];
  for (let i=0;i<countRows(r,m-2);i++){
    finMtrx[i] = [];
    for(let c=0;c<4;c++){
      for (let j=0;j<colsNumber(m-2);j++){
        finMtrx[i][c*colsNumber(m-2)+j] = firstRowMtrx[i][j];
      }
    }
  }
  /* second row */
  for (let i=countRows(r,m-2);i<countRows(r,m-2)+countRows(r-1,m-2);i++){
    finMtrx[i] = [];
    for (let j=0;j<colsNumber(m-2);j++){
      finMtrx[i][j] = 0;
    }
    for (let j=colsNumber(m-2);j<2*colsNumber(m-2);j++){
      finMtrx[i][j] = STRowMtrx[i-countRows(r,m-2)][j-colsNumber(m-2)];
    }
    for (let j=2*colsNumber(m-2);j<3*colsNumber(m-2);j++){
      finMtrx[i][j] = 0;
    }
    for (let j=3*colsNumber(m-2);j<4*colsNumber(m-2);j++){
      finMtrx[i][j] = STRowMtrx[i-countRows(r,m-2)][j-3*colsNumber(m-2)];
    }
  }
  /* third row */
  for (let i=countRows(r,m-2)+countRows(r-1,m-2);i<countRows(r,m-2)+2*countRows(r-1,m-2);i++){
    finMtrx[i] = [];
    for (let j=0;j<colsNumber(m-2);j++){
      finMtrx[i][j] = 0;
    }
    for (let j=colsNumber(m-2);j<2*colsNumber(m-2);j++){
      finMtrx[i][j] = 0;
    }
    for (let j=2*colsNumber(m-2);j<3*colsNumber(m-2);j++){
      finMtrx[i][j] = STRowMtrx[i-countRows(r,m-2)-countRows(r-1,m-2)][j-2*colsNumber(m-2)];
    }
    for (let j=3*colsNumber(m-2);j<4*colsNumber(m-2);j++){
      finMtrx[i][j] = STRowMtrx[i-countRows(r,m-2)-countRows(r-1,m-2)][j-3*colsNumber(m-2)];
    }
  }

  /* fourth */
  for (let i=countRows(r,m-2)+2*countRows(r-1,m-2);i<countRows(r,m);i++){
    finMtrx[i] = [];
    for(let j=0;j<3*colsNumber(m-2);j++){
      finMtrx[i][j] = 0;
    }
    for(let j=3*colsNumber(m-2);j<colsNumber(m);j++){
      finMtrx[i][j] = finMtrx[i-countRows(r,m-2)-2*countRows(r-1,m-2)][j-3*colsNumber(m-2)];
    }
  }

  return finMtrx;
}
