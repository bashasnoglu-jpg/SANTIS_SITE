
export function report(errors: any[]) {
    console.error("\n🔴 SANTIS OS INTEGRITY CHECK FAILED 🔴");
    console.error("=======================================");

    errors.forEach((err, index) => {
        console.error(`\n[Error ${index + 1}]`);
        console.error(JSON.stringify(err, null, 2));
    });

    console.error("\n=======================================");
    console.error(`Total Errors: ${errors.length}`);
    console.error("Fix these errors before deploying.\n");
}
