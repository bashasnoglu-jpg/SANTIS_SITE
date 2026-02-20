
const token = '01RnhNp0-PPhJplZKUJfBy0VwL70hbRUEf0Z1mjd';
async function verify() {
    console.log('Verifying token...');
    const res = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
        headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
}
verify();
