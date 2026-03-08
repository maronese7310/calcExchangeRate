// タイムスタンプを変換する
// 例として、timezoneをAsia/Tokyoに設定しているが、完成時にはデバイスのローカルタイムゾーンを使用するように変更する予定
function formatTimestamp(timestamp, timeZone = 'Asia/Tokyo') {

    const date = new Date(timestamp * 1000);

    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
        timeZone: timeZone
    };

    const formatted = new Intl.DateTimeFormat('ja-JP', options).format(date);

    return formatted.replace(/\//g, '/');
};