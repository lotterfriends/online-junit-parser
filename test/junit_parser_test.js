(function(){
  function getPromiseFromEvent(item, event) {
      return new Promise((resolve) => {
            const listener = () => {
                    item.removeEventListener(event, listener);
                    resolve();
                  }
            item.addEventListener(event, listener);
          })
  }

  async function waitForChange(item) {
      await getPromiseFromEvent(item, "change")
  }

  var chk_pass = 0;
  var chk_fail = 0;

  // selftest output is plain text. Don't use anything complex like XML ;-)
  function chk(msg, val, afn) {
    if (afn(val)) {
      chk_pass++;
      document.querySelector('#testlog').value += `✅ ${msg} (${val})\n`;
    } else {
      chk_fail++;
      document.querySelector('#testlog').value
        += `⛔ ${msg} (${val}): \"${afn.toString()}\"\n`;
    }
  }

  function chk_summary() {
    document.querySelector('#testlog').value
      += `\n-> Selftest completed: ${chk_pass} passed, ${chk_fail} failed\n`;
  }

  function test_suites_container() {
    document.querySelector('textarea.xml').value = `
<?xml version="1.0" encoding="UTF-8"?>
<testsuites disabled="0"
  errors="0"
  failures="1"
  name="xfstests_suites"
  tests="3"
  time="3">
  <testsuite name="xfstests" failures="1" skipped="1" tests="3" time="3" hostname="rapido1" timestamp="2022-09-29T12:54:02">
    <testcase classname="xfstests.global" name="generic/001" time="1">
      <skipped message="this test requires a valid $TEST_DEV" />
    </testcase>
    <testcase classname="xfstests.global" name="generic/002" time="1">
    </testcase>
    <testcase classname="xfstests.global" name="generic/656" time="1">
      <failure message="- output mismatch (see /home/ddiss/isms/xfstests-dev/results//generic/656.out.bad)" type="TestFail" />
    </testcase>
  </testsuite>
</testsuites>`;
    document.querySelector('textarea.xml').dispatchEvent(new Event('change'));
    // html is set after json, so can assume all json present after this(?)
    waitForChange(document.querySelector('textarea.html'));
    const obj = JSON.parse(document.querySelector('textarea.json').value);

    chk("testsuites len", obj.testsuites.length, (l) => {return (l === 1)});
    chk("testsuites name", obj.testsuites[0].name,
      (n) => {return (n === 'xfstests_suites')});

    chk("testsuite len", obj.testsuites[0].testsuite,
      (ts) => {return (ts.length === 1)});
    chk("testsuite name", obj.testsuites[0].testsuite[0].name,
      (n) => {return (n === 'xfstests')});

    const tcs = obj.testsuites[0].testsuite[0].testcases;
    chk("testcases len", tcs.length, (l) => {return (l === 3)});

    chk("testcase 0", tcs[0].name, (v) => {return (v === 'generic/001')});
    chk("testcase 0 result", tcs[0].skipped, (v) => {return (v !== null)});
    chk("testcase 0 msg", tcs[0].skipped.message,
      (m) => {return (m.startsWith('this test requires a valid $TEST_DEV'))}
    );
    chk("testcase 0 result", tcs[0].failure, (v) => {return (v === null)});
    chk("testcase 1", tcs[1].name, (v) => {return (v === 'generic/002')});
    chk("testcase 1 result", tcs[1].skipped, (v) => {return (v === null)});
    chk("testcase 1 result", tcs[1].failure, (v) => {return (v === null)});
    chk("testcase 2", tcs[2].name, (v) => {return (v === 'generic/656')});
    chk("testcase 2 result", tcs[2].skipped, (v) => {return (v === null)});
    chk("testcase 2 result", tcs[2].failure, (v) => {return (v !== null)});
    chk("testcase 2 msg", tcs[2].failure.message,
      (m) => {return (m.startsWith('- output mismatch'))}
    );
  }

  function test_no_suites_container() {
    document.querySelector('textarea.xml').value = `
<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="xfstests" failures="0" skipped="0" tests="3" time="3" hostname="rapido1" timestamp="2022-09-29T12:54:02">
  <testcase classname="xfstests.global" name="generic/001" time="1">
  </testcase>
  <testcase classname="xfstests.global" name="generic/002" time="1">
  </testcase>
  <testcase classname="xfstests.global" name="generic/656" time="1">
  </testcase>
</testsuite>`;
    document.querySelector('textarea.xml').dispatchEvent(new Event('change'));
    waitForChange(document.querySelector('textarea.html'));
    const obj = JSON.parse(document.querySelector('textarea.json').value);

    // testsuites node should still exist, but only as wrapper for testsuite
    chk("testsuites", obj.testsuites, (o) => {return (o !== null)});
    chk("testsuites len", obj.testsuites.length, (l) => {return (l === 1)});
    chk("testsuites name", obj.testsuites[0],
      (o) => {return (typeof(o.name) === 'undefined')});

    chk("testsuite len", obj.testsuites[0].testsuite,
      (ts) => {return (ts.length === 1)});
    chk("testsuite name", obj.testsuites[0].testsuite[0].name,
      (n) => {return (n === 'xfstests')});

    const tcs = obj.testsuites[0].testsuite[0].testcases;
    chk("testcases len", tcs.length, (l) => {return (l === 3)});
  }

  function test_syserr_out() {
    document.querySelector('textarea.xml').value = `
<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="xfstests" failures="1" skipped="1" tests="3" time="3" hostname="rapido1" timestamp="2022-09-29T12:54:02">
  <testcase classname="xfstests.global" name="generic/001" time="1">
    <skipped message="this test requires a valid $TEST_DEV" />
  </testcase>
  <testcase classname="xfstests.global" name="generic/002" time="1">
  </testcase>
  <testcase classname="xfstests.global" name="generic/656" time="1">
    <failure message="- output mismatch (see /home/ddiss/isms/xfstests-dev/results//generic/656.out.bad)" type="TestFail" />
    <system-out>
<![CDATA[
unexpected error testing for mount_setattr support
]]>
    </system-out>
    <system-err>
<![CDATA[
--- tests/generic/656.out 2022-01-03 11:54:09.000000000 +0000
+++ /home/ddiss/isms/xfstests-dev/results//generic/656.out.bad  2022-09-29 12:52:43.477115639 +0000
@@ -1,2 +1,4 @@
QA output created by 656
-Silence is golden
+/home/ddiss/isms/xfstests-dev/src/feature: error while loading shared libraries: libhandle.so.1: cannot open shared object file: No such file or directory
+unexpected error testing for mount_setattr support
+(see /home/ddiss/isms/xfstests-dev/results//generic/656.full for details)
]]>
    </system-err>
  </testcase>
</testsuite>`;
    document.querySelector('textarea.xml').dispatchEvent(new Event('change'));
    waitForChange(document.querySelector('textarea.html'));
    const obj = JSON.parse(document.querySelector('textarea.json').value);
    //
    chk("testsuites len", obj.testsuites.length, (l) => {return (l === 1)});
    chk("testsuite len", obj.testsuites[0].testsuite,
      (ts) => {return (ts.length === 1)});
    const tcs = obj.testsuites[0].testsuite[0].testcases;
    chk("testcases len", tcs.length, (l) => {return (l === 3)});

    chk("testcase 2", tcs[2].name, (v) => {return (v === 'generic/656')});
    chk("testcase 2 result", tcs[2].failure, (v) => {return (v !== null)});
    chk("testcase 2 msg", tcs[2].failure.message,
      (m) => {return (m.startsWith('- output mismatch'))}
    );
    chk("testcase 2 system-out", tcs[2].systemOut,
      (m) => {return (m.startsWith('unexpected error testing for mount_setattr'))}
    );
    chk("testcase 2 system-err", tcs[2].systemErr.split('\n')[0],
      (m) => {return (m.startsWith('--- tests/generic/656.out'))}
    );
  }

  function test_multi_suite() {
    document.querySelector('textarea.xml').value = `
<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="multi_suite">
  <testsuite name="xfstests" failures="0" skipped="0" tests="3" time="3" hostname="rapido1" timestamp="2022-09-29T12:54:02">
    <testcase classname="xfstests.global" name="generic/001" time="1">
    </testcase>
    <testcase classname="xfstests.global" name="generic/002" time="1">
    </testcase>
    <testcase classname="xfstests.global" name="generic/656" time="1">
    </testcase>
  </testsuite>
  <testsuite name="xfstests" failures="0" skipped="0" tests="2" time="2" hostname="rapido1" timestamp="2022-09-30T12:54:02">
    <testcase classname="xfstests.global" name="generic/004" time="1">
    </testcase>
    <testcase classname="xfstests.global" name="generic/005" time="1">
    </testcase>
  </testsuite>
</testsuites>`;
    document.querySelector('textarea.xml').dispatchEvent(new Event('change'));
    waitForChange(document.querySelector('textarea.html'));
    const obj = JSON.parse(document.querySelector('textarea.json').value);

    chk("testsuites", obj.testsuites, (o) => {return (o !== null)});
    chk("testsuites len", obj.testsuites.length, (l) => {return (l === 1)});
    chk("testsuites name", obj.testsuites[0].name,
      (n) => {return (n === 'multi_suite')});

    chk("testsuite len", obj.testsuites[0].testsuite,
      (ts) => {return (ts.length === 2)});
    chk("testsuite name", obj.testsuites[0].testsuite[0].name,
      (n) => {return (n === 'xfstests')});

    chk("testcases len", obj.testsuites[0].testsuite[0].testcases.length,
      (l) => {return (l === 3)});
    chk("testcases len", obj.testsuites[0].testsuite[1].testcases.length,
      (l) => {return (l === 2)});
  }

  test_suites_container();
  test_no_suites_container();
  test_syserr_out();
  test_multi_suite();

  chk_summary();
})();
