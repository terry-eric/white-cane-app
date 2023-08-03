export function log(text) {
    let log_ele = document.querySelector("#log")
    if (log_ele.value.length > 20000)
        log_ele.value = ""
    log_ele.value += text + "\n"
}
