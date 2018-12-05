import double from './double.js'

// let double = (numbers) => {
//   return numbers.map(n => n*2);
// };

let result = double([1,2,3]);

document.getElementById('result').innerHTML = result;
console.log(result);
