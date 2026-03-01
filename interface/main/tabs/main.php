<?php

/**
 * main.php
 *
 * @package   OpenEMR
 * @link      https://www.open-emr.org
 * @author    Kevin Yeh <kevin.y@integralemr.com>
 * @author    Brady Miller <brady.g.miller@gmail.com>
 * @author    Ranganath Pathak <pathak@scrs1.org>
 * @author    Jerry Padgett <sjpadgett@gmail.com>
 * @author    Stephen Nielson <snielson@discoverandchange.com>
 * @copyright Copyright (c) 2016 Kevin Yeh <kevin.y@integralemr.com>
 * @copyright Copyright (c) 2016-2019 Brady Miller <brady.g.miller@gmail.com>
 * @copyright Copyright (c) 2019 Ranganath Pathak <pathak@scrs1.org>
 * @copyright Copyright (c) 2024 Care Management Solutions, Inc. <stephen.waite@cmsvt.com>
 * @license   https://github.com/openemr/openemr/blob/master/LICENSE GNU General Public License 3
 */

$sessionAllowWrite = true;
require_once(__DIR__ . '/../../globals.php');
require_once $GLOBALS['srcdir'] . '/ESign/Api.php';

use ESign\Api;
use OpenEMR\Common\Acl\AclMain;
use OpenEMR\Common\Csrf\CsrfUtils;
use OpenEMR\Common\Twig\TwigContainer;
use OpenEMR\Core\Header;
use OpenEMR\Core\OEGlobalsBag;
use OpenEMR\Events\Main\Tabs\RenderEvent;
use OpenEMR\Menu\MainMenuRole;
use OpenEMR\Services\LogoService;
use OpenEMR\Services\ProductRegistrationService;
use OpenEMR\Telemetry\TelemetryService;
use Symfony\Component\Filesystem\Path;

const ENV_DISABLE_TELEMETRY = 'OPENEMR_DISABLE_TELEMETRY';

$logoService = new LogoService();
$menuLogo = $logoService->getLogo('core/menu/primary/');
// Registration status and options.
$productRegistration = new ProductRegistrationService();
$product_row = $productRegistration->getProductDialogStatus();
$allowRegisterDialog = $product_row['allowRegisterDialog'] ?? 0;
$allowTelemetry = $product_row['allowTelemetry'] ?? null; // for dialog
$allowEmail = $product_row['allowEmail'] ?? null; // for dialog

// Check if telemetry is disabled via environment variable
// Telemetry disable flag (set env var to: 1/true)
$val = getenv(ENV_DISABLE_TELEMETRY);
if ($val === false || $val === '') {
    $val = $_ENV[ENV_DISABLE_TELEMETRY] ?? $_SERVER[ENV_DISABLE_TELEMETRY] ?? null;
}
$disableTelemetry = ($val !== null) && filter_var($val, FILTER_VALIDATE_BOOLEAN);
if ($disableTelemetry) {
    $allowRegisterDialog = false;
    $allowTelemetry = false;
}

// If running unit tests, then disable the registration dialog
if ($_SESSION['testing_mode'] ?? false) {
    $allowRegisterDialog = false;
}
// If the user is not a super admin, then disable the registration dialog
if (!AclMain::aclCheckCore('admin', 'super')) {
    $allowRegisterDialog = false;
}

// Ensure token_main matches so this script can not be run by itself
//  If tokens do not match, then destroy the session and go back to log in screen
if (
    (empty($_SESSION['token_main_php'])) ||
    (empty($_GET['token_main'])) ||
    ($_GET['token_main'] != $_SESSION['token_main_php'])
) {
// Below functions are from auth.inc, which is included in globals.php
    authCloseSession();
    authLoginScreen(false);
}
// this will not allow copy/paste of the link to this main.php page or a refresh of this main.php page
//  (default behavior, however, this behavior can be turned off in the prevent_browser_refresh global)
if ($GLOBALS['prevent_browser_refresh'] > 1) {
    unset($_SESSION['token_main_php']);
}

$esignApi = new Api();
$twig = (new TwigContainer(null, OEGlobalsBag::getInstance()->getKernel()))->getTwig();

?>
<!DOCTYPE html>
<html>

<head>
    <title><?php echo text($openemr_name); ?></title>

    <script>
        // This is to prevent users from losing data by refreshing or backing out of OpenEMR.
        //  (default behavior, however, this behavior can be turned off in the prevent_browser_refresh global)
        <?php if ($GLOBALS['prevent_browser_refresh'] > 0) { ?>
        window.addEventListener('beforeunload', (event) => {
            if (!timed_out) {
                event.returnValue = <?php echo xlj('Recommend not leaving or refreshing or you may lose data.'); ?>;
            }
        });
        <?php } ?>

        <?php require($GLOBALS['srcdir'] . "/restoreSession.php"); ?>

        // Since this should be the parent window, this is to prevent calls to the
        // window that opened this window. For example when a new window is opened
        // from the Patient Flow Board or the Patient Finder.
        window.opener = null;
        window.name = "main";

        // This flag indicates if another window or frame is trying to reload the login
        // page to this top-level window.  It is set by javascript returned by auth.inc.php
        // and is checked by handlers of beforeunload events.
        var timed_out = false;
        // some globals to access using top.variable
        // note that 'let' or 'const' does not allow global scope here.
        // only use var
        var isPortalEnabled = "<?php echo $GLOBALS['portal_onsite_two_enable'] ?>";
        // Set the csrf_token_js token that is used in the below js/tabs_view_model.js script
        var csrf_token_js = <?php echo js_escape(CsrfUtils::collectCsrfToken()); ?>;
        var userDebug = <?php echo js_escape($GLOBALS['user_debug']); ?>;
        var webroot_url = <?php echo js_escape($web_root); ?>;
        var jsLanguageDirection = <?php echo js_escape($_SESSION['language_direction']); ?> ||
        'ltr';
        var jsGlobals = {};
        // used in tabs_view_model.js.
        jsGlobals.enable_group_therapy = <?php echo js_escape($GLOBALS['enable_group_therapy']); ?>;
        jsGlobals.languageDirection = jsLanguageDirection;
        jsGlobals.date_display_format = <?php echo js_escape($GLOBALS['date_display_format']); ?>;
        jsGlobals.time_display_format = <?php echo js_escape($GLOBALS['time_display_format']); ?>;
        jsGlobals.timezone = <?php echo js_escape($GLOBALS['gbl_time_zone'] ?? ''); ?>;
        jsGlobals.assetVersion = <?php echo js_escape($GLOBALS['v_js_includes']); ?>;
        var WindowTitleAddPatient = <?php echo($GLOBALS['window_title_add_patient_name'] ? 'true' : 'false'); ?>;
        var WindowTitleBase = <?php echo js_escape($openemr_name); ?>;
        const isSms = "<?php echo !empty($GLOBALS['oefax_enable_sms'] ?? null); ?>";
        const isFax = "<?php echo !empty($GLOBALS['oefax_enable_fax']) ?? null?>";
        const isServicesOther = (isSms || isFax);
        var telemetryEnabled = <?php echo js_escape((new TelemetryService())->isTelemetryEnabled()); ?>;

        /**
         * Async function to get session value from the server
         * Usage Example
         * let authUser;
         * let sessionPid = await top.getSessionValue('pid');
         * // If using then() method a promise is returned instead of the value.
         * await top.getSessionValue('authUser').then(function (auth) {
         *    authUser = auth;
         *    console.log('authUser', authUser);
         * });
         * console.log('session pid', sessionPid);
         * console.log('auth User', authUser);
         */
        async function getSessionValue(key) {
            restoreSession();
            let csrf_token_js = <?php echo js_escape(CsrfUtils::collectCsrfToken('default')); ?>;
            const config = {
                url: `${webroot_url}/library/ajax/set_pt.php?csrf_token_form=${csrf_token_js}`,
                method: 'POST',
                data: {
                    mode: 'session_key',
                    key: key
                }
            };
            try {
                const response = await $.ajax(config);
                restoreSession();
                return response;
            } catch (error) {
                throw error;
            }
        }

        function goRepeaterServices() {
            // Ensure send the skip_timeout_reset parameter to not count this as a manual entry in the
            // timing out mechanism in OpenEMR.

            // Send the skip_timeout_reset parameter to not count this as a manual entry in the
            // timing out mechanism in OpenEMR. Notify App for various portal and reminder alerts.
            // Combined portal and reminders ajax to fetch sjp 06-07-2020.
            // Incorporated timeout mechanism in 2021
            restoreSession();
            let request = new FormData;
            request.append("skip_timeout_reset", "1");
            request.append("isPortal", isPortalEnabled);
            request.append("isServicesOther", isServicesOther);
            request.append("isSms", isSms);
            request.append("isFax", isFax);
            request.append("csrf_token_form", csrf_token_js);
            fetch(webroot_url + "/library/ajax/dated_reminders_counter.php", {
                method: 'POST',
                credentials: 'same-origin',
                body: request
            }).then((response) => {
                if (response.status !== 200) {
                    console.log('Reminders start failed. Status Code: ' + response.status);
                    return;
                }
                return response.json();
            }).then((data) => {
                if (data.timeoutMessage && (data.timeoutMessage == 'timeout')) {
                    // timeout has happened, so logout
                    timeoutLogout();
                }
                if (isPortalEnabled) {
                    let mail = data.mailCnt;
                    let chats = data.chatCnt;
                    let audits = data.auditCnt;
                    let payments = data.paymentCnt;
                    let total = data.total;
                    let enable = ((1 * mail) + (1 * audits)); // payments are among audits.
                    // Send portal counts to notification button model
                    // Will turn off button display if no notification!
                    app_view_model.application_data.user().portal(enable);
                    if (enable > 0) {
                        app_view_model.application_data.user().portalAlerts(total);
                        app_view_model.application_data.user().portalAudits(audits);
                        app_view_model.application_data.user().portalMail(mail);
                        app_view_model.application_data.user().portalChats(chats);
                        app_view_model.application_data.user().portalPayments(payments);
                    }
                }
                if (isServicesOther) {
                    let sms = data.smsCnt;
                    let fax = data.faxCnt;
                    let total = data.serviceTotal;
                    let enable = ((1 * sms) + (1 * fax));
                    // Will turn off button display if no notification!
                    app_view_model.application_data.user().servicesOther(enable);
                    if (enable > 0) {
                        app_view_model.application_data.user().serviceAlerts(total);
                        app_view_model.application_data.user().smsAlerts(sms);
                        app_view_model.application_data.user().faxAlerts(fax);
                    }
                }
                // Always send reminder count text to model
                app_view_model.application_data.user().messages(data.reminderText);
            }).catch(function (error) {
                console.log('Request failed', error);
            });

            // run background-services
            // delay 10 seconds to prevent both utility trigger at close to same time.
            // Both call globals so that is my concern.
            setTimeout(function () {
                restoreSession();
                request = new FormData;
                request.append("skip_timeout_reset", "1");
                request.append("ajax", "1");
                request.append("csrf_token_form", csrf_token_js);
                fetch(webroot_url + "/library/ajax/execute_background_services.php", {
                    method: 'POST',
                    credentials: 'same-origin',
                    body: request
                }).then((response) => {
                    if (response.status !== 200) {
                        console.log('Background Service start failed. Status Code: ' + response.status);
                    }
                }).catch(function (error) {
                    console.log('HTML Background Service start Request failed: ', error);
                });
            }, 10000);

            // auto run this function every 60 seconds
            var repeater = setTimeout("goRepeaterServices()", 60000);
        }

        function isEncounterLocked(encounterId) {
            <?php if ($esignApi->lockEncounters()) { ?>
            // If encounter locking is enabled, make a synchronous call (async=false) to check the
            // DB to see if the encounter is locked.
            // Call restore session, just in case
            // @TODO next clean up pass, turn into await promise then modify tabs_view_model.js L-309
            restoreSession();
            let url = webroot_url + "/interface/esign/index.php?module=encounter&method=esign_is_encounter_locked";
            $.ajax({
                type: 'POST',
                url: url,
                data: {
                    encounterId: encounterId
                },
                success: function (data) {
                    encounter_locked = data;
                },
                dataType: 'json',
                async: false
            });
            return encounter_locked;
            <?php } else { ?>
            // If encounter locking isn't enabled then always return false
            return false;
            <?php } ?>
        }
    </script>

    <?php Header::setupHeader(['knockout', 'tabs-theme', 'i18next', 'hotkeys', 'i18formatting']); ?>
    <script>
        // set up global translations for js
        function setupI18n(lang_id) {
            restoreSession();
            return fetch(<?php echo js_escape($GLOBALS['webroot']) ?> +"/library/ajax/i18n_generator.php?lang_id=" + encodeURIComponent(lang_id) + "&csrf_token_form=" + encodeURIComponent(csrf_token_js), {
                credentials: 'same-origin',
                method: 'GET'
            }).then((response) => {
                if (response.status !== 200) {
                    console.log('I18n setup failed. Status Code: ' + response.status);
                    return [];
                }
                return response.json();
            })
        }

        setupI18n(<?php echo js_escape($_SESSION['language_choice']); ?>).then(translationsJson => {
            i18next.init({
                lng: 'selected',
                debug: false,
                nsSeparator: false,
                keySeparator: false,
                resources: {
                    selected: {
                        translation: translationsJson
                    }
                }
            });
        }).catch(error => {
            console.log(error.message);
        });

        /**
         * Assign and persist documents to portal patients
         * @var int patientId pid
         */
        function assignPatientDocuments(patientId) {
            let url = top.webroot_url + '/portal/import_template_ui.php?from_demo_pid=' + encodeURIComponent(patientId);
            dlgopen(url, 'pop-assignments', 'modal-lg', 850, '', '', {
                allowDrag: true,
                allowResize: true,
                sizeHeight: 'full',
            });
        }
    </script>

    <script src="js/custom_bindings.js?v=<?php echo $v_js_includes; ?>"></script>
    <script src="js/user_data_view_model.js?v=<?php echo $v_js_includes; ?>"></script>
    <script src="js/patient_data_view_model.js?v=<?php echo $v_js_includes; ?>"></script>
    <script src="js/therapy_group_data_view_model.js?v=<?php echo $v_js_includes; ?>"></script>
    <script src="js/tabs_view_model.js?v=<?php echo $v_js_includes; ?>"></script>
    <script src="js/application_view_model.js?v=<?php echo $v_js_includes; ?>"></script>
    <script src="js/frame_proxies.js?v=<?php echo $v_js_includes; ?>"></script>
    <script src="js/dialog_utils.js?v=<?php echo $v_js_includes; ?>"></script>
    <script src="js/shortcuts.js?v=<?php echo $v_js_includes; ?>"></script>

    <?php
    // Below code block is to prepare certain elements for deciding what links to show on the menu
    // prepare Ensora eRx globals that are used in creating the menu
    if ($GLOBALS['erx_enable']) {
        $newcrop_user_role_sql = sqlQuery("SELECT `newcrop_user_role` FROM `users` WHERE `username` = ?", [$_SESSION['authUser']]);
        $GLOBALS['newcrop_user_role'] = $newcrop_user_role_sql['newcrop_user_role'];
        if ($GLOBALS['newcrop_user_role'] === 'erxadmin') {
            $GLOBALS['newcrop_user_role_erxadmin'] = 1;
        }
    }

    // prepare track anything to be used in creating the menu
    $track_anything_sql = sqlQuery("SELECT `state` FROM `registry` WHERE `directory` = 'track_anything'");
    $GLOBALS['track_anything_state'] = ($track_anything_sql['state'] ?? 0);
    // prepare Issues popup link global that is used in creating the menu
    $GLOBALS['allow_issue_menu_link'] = (
        (AclMain::aclCheckCore('encounters', 'notes', '', 'write')
        || AclMain::aclCheckCore('encounters', 'notes_a', '', 'write'))
        && AclMain::aclCheckCore('patients', 'med', '', 'write')
    );

    // we use twig templates here so modules can customize some of these files
    // at some point we will twigify all of main.php so we can extend it.
    echo $twig->render("interface/main/tabs/tabs_template.html.twig", []);
    echo $twig->render("interface/main/tabs/menu_template.html.twig", []);
    // TODO: patient_data_template.php is a more extensive refactor that could be done in a future feature request but to not jeopardize 7.0.3 release we will hold off.
    ?>
    <?php require_once("templates/patient_data_template.php"); ?>
    <?php
    echo $twig->render("interface/main/tabs/therapy_group_template.html.twig", []);
    echo $twig->render("interface/main/tabs/user_data_template.html.twig", [
        'openemr_name' => $GLOBALS['openemr_name']
    ]);
    // Collect the menu then build it
    $menuMain = new MainMenuRole(OEGlobalsBag::getInstance()->getKernel()->getEventDispatcher());
    $menu_restrictions = $menuMain->getMenu();
    echo $twig->render("interface/main/tabs/menu_json.html.twig", ['menu_restrictions' => $menu_restrictions]);
    ?>
    <?php $userQuery = sqlQuery("select * from users where username = ?", [$_SESSION['authUser']]); ?>

    <script>
        <?php
        if ($_SESSION['default_open_tabs']) :
            // For now, only the first tab is visible, this could be improved upon by further customizing the list options in a future feature request
            $visible = "true";
            foreach ($_SESSION['default_open_tabs'] as $i => $tab) :
                $_unsafe_url = preg_replace('/(\?.*)/m', '', Path::canonicalize($fileroot . DIRECTORY_SEPARATOR . $tab['notes']));
                if (realpath($_unsafe_url) === false || !str_starts_with($_unsafe_url, (string) $fileroot)) {
                    unset($_SESSION['default_open_tabs'][$i]);
                    continue;
                }
                $url = json_encode($webroot . "/" . $tab['notes']);
                $target = json_encode($tab['option_id']);
                $label = json_encode(xl("Loading") . " " . $tab['title']);
                $loading = xlj("Loading");
                echo "app_view_model.application_data.tabs.tabsList.push(new tabStatus($label, $url, $target, $loading, true, $visible, false));\n";
                $visible = "false";
            endforeach;
        endif;
        ?>

        app_view_model.application_data.user(new user_data_view_model(<?php echo json_encode($_SESSION["authUser"])
            . ',' . json_encode($userQuery['fname'])
            . ',' . json_encode($userQuery['lname'])
            . ',' . json_encode($_SESSION['authProvider']); ?>));
    </script>
    <style>
      html,
      body {
        width: max-content;
        min-height: 100% !important;
        height: 100% !important;
      }
      #userdropdown.dropdown-menu {
        white-space: nowrap;        /* prevents multi-line wrapping */
        min-width: max-content;     /* expands to fit the widest item */
      }
    </style>
</head>

<body class="min-vw-100">
    <?php
    // fire off an event here
    if (OEGlobalsBag::getInstance()->hasKernel()) {
        $dispatcher = OEGlobalsBag::getInstance()->getKernel()->getEventDispatcher();
        $dispatcher->dispatch(new RenderEvent(), RenderEvent::EVENT_BODY_RENDER_PRE);
    }
    ?>
    <!-- Below iframe is to support logout, which needs to be run in an inner iframe to work as intended -->
    <iframe name="logoutinnerframe" id="logoutinnerframe" style="visibility:hidden; position:absolute; left:0; top:0; height:0; width:0; border:none;" src="about:blank"></iframe>
    <?php // mdsupport - app settings
    $disp_mainBox = '';
    if (isset($_SESSION['app1'])) {
        $rs = sqlquery(
            "SELECT title app_url FROM list_options WHERE activity=1 AND list_id=? AND option_id=?",
            ['apps', $_SESSION['app1']]
        );
        if ($rs['app_url'] != "main/main_screen.php") {
            echo '<iframe name="app1" src="../../' . attr($rs['app_url']) . '"
            style="position: absolute; left: 0; top: 0; height: 100%; width: 100%; border: none;" />';
            $disp_mainBox = 'style="display: none;"';
        }
    }
    ?>
    <div id="mainBox" <?php echo $disp_mainBox ?>>
        <nav class="navbar navbar-expand-xl navbar-light bg-light py-0">
            <?php if ($GLOBALS['display_main_menu_logo'] === '1') : ?>
                <a class="navbar-brand" href="https://www.open-emr.org" title="OpenEMR <?php echo xla("Website"); ?>" rel="noopener" target="_blank">
                    <img src="<?php echo $menuLogo; ?>" class="d-inline-block align-middle" height="16" alt="<?php echo xlt('Main Menu Logo'); ?>">
                </a>
            <?php endif; ?>
            <button class="navbar-toggler mr-auto" type="button" data-toggle="collapse" data-target="#mainMenu" aria-controls="mainMenu" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="mainMenu" data-bind="template: {name: 'menu-template', data: application_data}"></div>
            <?php if ($GLOBALS['search_any_patient'] != 'none') : ?>
                <form name="frm_search_globals" class="form-inline">
                    <div class="input-group">
                        <input type="text" id="anySearchBox" class="form-control-sm <?php echo $any_search_class ?> form-control" name="anySearchBox" placeholder="<?php echo xla("Search by any demographics") ?>" autocomplete="off">
                        <div class="input-group-append">
                            <button type="button" id="search_globals" class="btn btn-sm btn-secondary <?php echo $search_globals_class ?>" title='<?php echo xla("Search for patient by entering whole or part of any demographics field information"); ?>' data-bind="event: {mousedown: viewPtFinder.bind( $data, '<?php echo xla("The search field cannot be empty. Please enter a search term") ?>', '<?php echo attr($search_any_type); ?>')}">
                                <i class="fa fa-search">&nbsp;</i></button>
                        </div>
                    </div>
                </form>
            <?php endif; ?>
            <!--Below is the user data section that contains the user information and the attendant data-->
            <span id="userData" data-bind="template: {name: 'user-data-template', data: application_data}"></span>
            <?php
            // fire off a nav event
            $dispatcher->dispatch(new RenderEvent(), RenderEvent::EVENT_BODY_RENDER_NAV);
            ?>
            
        </nav>
        <div id="attendantData" class="body_title acck" data-bind="template: {name: app_view_model.attendant_template_type, data: application_data}"></div>
        <div class="body_title pt-1" id="tabs_div" data-bind="template: {name: 'tabs-controls', data: application_data}"></div>
        <div class="mainFrames d-flex flex-row" id="mainFrames_div">
            <div id="framesDisplay" data-bind="template: {name: 'tabs-frames', data: application_data}"></div>
        </div>
        <?php echo $twig->render("product_registration/product_registration_modal.html.twig", [
            'webroot' => $webroot,
            'allowEmail' => $allowEmail ?? false,
            'allowTelemetry' => $allowTelemetry ?? false]); ?>
    </div>
    <script>
        ko.applyBindings(app_view_model);

        $(function () {
            $('.dropdown-toggle').dropdown();
            $('#patient_caret').click(function () {
                $('#attendantData').slideToggle();
                $('#patient_caret').toggleClass('fa-caret-down').toggleClass('fa-caret-up');
            });
            if ($('body').css('direction') == "rtl") {
                $('.dropdown-menu-right').each(function () {
                    $(this).removeClass('dropdown-menu-right');
                });
            }
        });
        $(function () {
            $('#logo_menu').focus();
        });
        $('#anySearchBox').keypress(function (event) {
            if (event.which === 13 || event.keyCode === 13) {
                event.preventDefault();
                $('#search_globals').mousedown();
            }
        });
        document.addEventListener('touchstart', {}); //specifically added for iOS devices, especially in iframes
        <?php if (($_ENV['OPENEMR__NO_BACKGROUND_TASKS'] ?? 'false') !== 'true') { ?>
        $(function () {
            goRepeaterServices();
        });
        <?php } ?>
    </script>
    <?php

    // fire off an event here
    $dispatcher->dispatch(new RenderEvent(), RenderEvent::EVENT_BODY_RENDER_POST);

    if (!empty($allowRegisterDialog)) { // disable if running unit tests.
        // Include the product registration js, telemetry and usage data reporting dialog
        echo $twig->render("product_registration/product_reg.js.twig", ['webroot' => $webroot]);
    }

    ?>
<style>
#ai-chat-fab {
    position: fixed;
    bottom: 28px;
    right: 28px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #343a40;
    color: #fff;
    border: none;
    box-shadow: 0 4px 16px rgba(0,0,0,0.25);
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 1060;
    transition: right 0.3s ease, transform 0.15s ease, box-shadow 0.15s ease;
}
#ai-chat-fab:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(0,0,0,0.3);
}
#ai-chat-fab.panel-open {
    right: 598px;
    display: none;
}
#ai-chat-panel {
    position: fixed;
    top: 0;
    right: -570px;
    width: 570px;
    height: 100vh;
    background: #fff;
    border-left: 1px solid #dee2e6;
    border-top-left-radius: 12px;
    border-bottom-left-radius: 12px;
    box-shadow: -4px 0 24px rgba(0,0,0,0.15);
    z-index: 1050;
    display: flex;
    flex-direction: column;
    transition: right 0.3s ease;
    overflow: hidden;
}
#ai-chat-panel.open { right: 0; }
#mainBox {
    transition: width 0.3s ease;
}
#mainBox.ai-open {
    width: calc(100% - 570px) !important;
}
#ai-chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: #343a40;
    color: #fff;
    flex-shrink: 0;
}
#ai-chat-header span { font-weight: 600; font-size: 0.95rem; }
#ai-chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: #f8f9fa;
}
.ai-msg {
    font-size: 0.875rem;
    line-height: 1.5;
    word-break: break-word;
}
.ai-msg.user {
    white-space: pre-wrap;
    align-self: flex-end;
    max-width: 85%;
    padding: 8px 12px;
    border-radius: 12px;
    border-bottom-right-radius: 3px;
    background: #0069d9;
    color: #fff;
}
.ai-msg.assistant {
    align-self: stretch;
    width: 100%;
    padding: 4px 0;
    background: none;
    border: none;
    border-radius: 0;
}
.ai-msg.escalated { border-left: 3px solid #dc3545; padding-left: 8px; }
.ai-msg-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    font-size: 0.72rem;
    color: #6c757d;
    margin-top: 3px;
    align-self: flex-start;
}
.ai-feedback-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
    align-self: flex-start;
}
.ai-feedback-btn {
    background: #fff;
    border: 1px solid #ced4da;
    border-radius: 6px;
    padding: 1px 8px;
    font-size: 0.78rem;
    line-height: 1.4;
    cursor: pointer;
    color: #495057;
}
.ai-feedback-btn:hover:not(:disabled) { background: #f1f3f5; }
.ai-feedback-btn:disabled { opacity: 0.55; cursor: default; }
.ai-feedback-thanks { font-size: 0.72rem; color: #6c757d; }
.ai-escalate-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: #dc3545;
    color: #fff;
    border: none;
    border-radius: 4px;
    padding: 2px 8px;
    font-size: 0.7rem;
    font-weight: 600;
    cursor: pointer;
    letter-spacing: 0.03em;
    text-transform: uppercase;
}
.ai-escalate-btn:hover { background: #b02a37; }
#ai-chat-footer {
    padding: 10px;
    border-top: 1px solid #dee2e6;
    background: #fff;
    flex-shrink: 0;
}
#ai-chat-input {
    resize: none;
    font-size: 0.875rem;
}
#ai-patient-chip {
    display: inline-flex;
    align-items: center;
    gap: 0;
    border-radius: 20px;
    font-size: 0.75rem;
    margin-bottom: 8px;
    max-width: 100%;
    overflow: hidden;
    white-space: nowrap;
    box-shadow: 0 1px 3px rgba(0,0,0,0.12);
}
#ai-patient-chip .chip-label {
    background: #2563eb;
    color: #fff;
    font-weight: 600;
    letter-spacing: 0.03em;
    padding: 3px 8px;
    border-radius: 20px 0 0 20px;
    flex-shrink: 0;
    text-transform: uppercase;
    font-size: 0.68rem;
}
#ai-patient-chip .chip-value {
    background: #dbeafe;
    color: #1e40af;
    padding: 3px 10px 3px 7px;
    border-radius: 0 20px 20px 0;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 500;
}
.ai-meta-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin: 6px 0 2px;
}
.ai-meta-callout {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.12);
    margin: 6px 0;
    font-size: 0.82rem;
}
.ai-meta-callout-label {
    background: #374151;
    color: #f9fafb;
    padding: 5px 12px;
    font-weight: 700;
    text-transform: uppercase;
    font-size: 0.63rem;
    letter-spacing: 0.07em;
}
.ai-meta-callout-value {
    background: #f3f4f6;
    color: #111827;
    padding: 8px 12px;
    line-height: 1.5;
}
.ai-meta-chip {
    display: inline-flex;
    align-items: stretch;
    border-radius: 20px;
    font-size: 0.72rem;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.12);
    line-height: 1.3;
}
.ai-meta-chip-label {
    background: #374151;
    color: #f9fafb;
    padding: 3px 8px;
    border-radius: 20px 0 0 20px;
    font-weight: 700;
    text-transform: uppercase;
    font-size: 0.63rem;
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
    flex-shrink: 0;
}
.ai-meta-chip-value {
    background: #e5e7eb;
    color: #111827;
    padding: 3px 10px 3px 7px;
    border-radius: 0 20px 20px 0;
    font-weight: 500;
    display: flex;
    align-items: center;
}
.ai-msg.assistant hr { display: none; }
.ai-msg.assistant p { margin: 0 0 0.4em; }
.ai-msg.assistant p:last-child { margin-bottom: 0; }
.ai-msg.assistant ul, .ai-msg.assistant ol { padding-left: 1.25em; margin: 0.25em 0; }
.ai-msg.assistant ul.pill-list { list-style: none; padding: 0; display: flex; flex-wrap: wrap; gap: 6px; margin: 0.4em 0; }
.ai-msg.assistant ul.pill-list li { padding: 0; }
.ai-msg.assistant ul.pill-list li a { display: inline-block; padding: 4px 12px; background: #e8f0fe; color: #1a73e8; border-radius: 20px; font-size: 0.82rem; font-weight: 500; text-decoration: none; border: 1px solid #c5d8fb; transition: background 0.15s, color 0.15s; }
.ai-msg.assistant ul.pill-list li a:hover { background: #1a73e8; color: #fff; border-color: #1a73e8; }
.ai-msg.assistant pre { background: #f1f3f5; border-radius: 6px; padding: 8px; overflow-x: auto; font-size: 0.8rem; margin: 0.4em 0; }
.ai-msg.assistant code { background: #f1f3f5; border-radius: 3px; padding: 1px 4px; font-size: 0.82em; }
.ai-msg.assistant pre code { background: none; padding: 0; }
.ai-msg.assistant h1, .ai-msg.assistant h2, .ai-msg.assistant h3 { font-size: 0.95rem; font-weight: 600; margin: 0.5em 0 0.25em; }
.ai-msg.assistant table { border-collapse: collapse; font-size: 0.82rem; margin: 0.4em 0; }
.ai-msg.assistant th, .ai-msg.assistant td { border: 1px solid #dee2e6; padding: 3px 8px; }
.ai-tool-call {
    font-size: 0.78rem;
    border: 1px solid #dee2e6;
    border-left: 3px solid #6c757d;
    border-radius: 6px;
    background: #f8f9fa;
    align-self: flex-start;
    max-width: 95%;
}
.ai-tool-call summary {
    padding: 5px 10px;
    cursor: pointer;
    user-select: none;
    display: flex;
    align-items: center;
    gap: 6px;
    color: #495057;
    font-family: monospace;
    list-style: none;
    border-radius: 6px;
}
details.ai-tool-call[open] summary {
    border-radius: 6px 6px 0 0;
}
.ai-tool-call summary::-webkit-details-marker { display: none; }
.ai-tool-call summary::before { content: '▶'; font-size: 0.6rem; color: #adb5bd; flex-shrink: 0; }
details.ai-tool-call[open] summary::before { content: '▼'; }
.ai-tool-call-body {
    padding: 6px 10px;
    border-top: 1px solid #dee2e6;
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.ai-tool-call-section { font-size: 0.72rem; color: #6c757d; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; }
.ai-tool-call-pre {
    margin: 0;
    background: #fff;
    border: 1px solid #e9ecef;
    border-radius: 4px;
    padding: 4px 7px;
    font-size: 0.75rem;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 140px;
    overflow-y: auto;
    color: #212529;
}
</style>

<button id="ai-chat-fab" title="<?php echo xla('AI Assistant'); ?>">✨</button>

<div id="ai-chat-panel">
    <div id="ai-chat-header">
        <span>✨ <?php echo xlt('AI Assistant'); ?></span>
        <button id="ai-chat-close" class="btn btn-sm btn-outline-light py-0 px-2">&times;</button>
    </div>
    <div id="ai-chat-messages"></div>
    <div id="ai-chat-footer">
        <div id="ai-patient-chip" style="display:none;"></div>
        <textarea id="ai-chat-input" class="form-control mb-2" rows="2" placeholder="<?php echo xla('Ask a clinical question...'); ?>"></textarea>
        <button id="ai-chat-send" class="btn btn-primary btn-sm btn-block">
            <i class="fas fa-paper-plane mr-1"></i><?php echo xlt('Send'); ?>
        </button>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/dompurify/dist/purify.min.js"></script>
<script>
(function () {
    var SESSION_ID = 'ai-' + Date.now();
    var AGENT_URL = '<?php echo $GLOBALS['webroot']; ?>/interface/main/tabs/ai_chat_proxy.php';
    var FEEDBACK_URL = '<?php echo $GLOBALS['webroot']; ?>/interface/main/tabs/ai_feedback_proxy.php';

    var panel   = document.getElementById('ai-chat-panel');
    var toggle  = document.getElementById('ai-chat-fab');
    var close   = document.getElementById('ai-chat-close');
    var input   = document.getElementById('ai-chat-input');
    var send    = document.getElementById('ai-chat-send');
    var messages = document.getElementById('ai-chat-messages');
    var patientChip = document.getElementById('ai-patient-chip');

    var mainBox = document.getElementById('mainBox');

    function updatePatientChip() {
        try {
            var pt = app_view_model.application_data.patient();
            if (pt && pt.pname && pt.pname()) {
                patientChip.innerHTML = '<span class="chip-label">👤 Patient</span><span class="chip-value">' + pt.pname() + '</span>';
                patientChip.style.display = 'inline-flex';
            } else {
                patientChip.style.display = 'none';
            }
        } catch (e) {
            patientChip.style.display = 'none';
        }
    }

    function openPanel() {
        panel.classList.add('open');
        mainBox.classList.add('ai-open');
        toggle.classList.add('panel-open');
        updatePatientChip();
    }
    function closePanel() {
        panel.classList.remove('open');
        mainBox.classList.remove('ai-open');
        toggle.classList.remove('panel-open');
    }

    toggle.addEventListener('click', function () {
        panel.classList.contains('open') ? closePanel() : openPanel();
    });
    close.addEventListener('click', closePanel);

    try {
        app_view_model.application_data.patient.subscribe(updatePatientChip);
    } catch (e) {}


    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
    send.addEventListener('click', sendMessage);

    var TOOL_ICONS = {
        drugInteractionTool: '💊',
        icd10LookupTool: '🏷️',
        medicationInfoTool: '💉',
        symptomLookupTool: '🔍',
        providerSearchTool: '👤',
        pubmedSearchTool: '📄'
    };

    function appendToolCalls(toolCalls) {
        if (!toolCalls || !toolCalls.length) return;
        toolCalls.forEach(function(tc) {
            var details = document.createElement('details');
            details.className = 'ai-tool-call';

            var summary = document.createElement('summary');
            var icon = TOOL_ICONS[tc.name] || '🔧';
            summary.textContent = icon + ' ' + tc.name;
            details.appendChild(summary);

            var body = document.createElement('div');
            body.className = 'ai-tool-call-body';

            var inLabel = document.createElement('div');
            inLabel.className = 'ai-tool-call-section';
            inLabel.textContent = 'Input';
            body.appendChild(inLabel);

            var inPre = document.createElement('pre');
            inPre.className = 'ai-tool-call-pre';
            inPre.textContent = JSON.stringify(tc.input, null, 2);
            body.appendChild(inPre);

            if (tc.output !== null && tc.output !== undefined) {
                var outLabel = document.createElement('div');
                outLabel.className = 'ai-tool-call-section';
                outLabel.textContent = 'Output';
                body.appendChild(outLabel);

                var outPre = document.createElement('pre');
                outPre.className = 'ai-tool-call-pre';
                outPre.textContent = typeof tc.output === 'string'
                    ? tc.output
                    : JSON.stringify(tc.output, null, 2);
                body.appendChild(outPre);
            }

            details.appendChild(body);
            messages.appendChild(details);
        });
        messages.scrollTop = messages.scrollHeight;
    }

    function styleMetadataChips(container) {
        var chips = [];
        container.querySelectorAll('p').forEach(function(p) {
            var label = null, value = null;
            var strong = p.firstElementChild;

            if (strong && strong.tagName === 'STRONG') {
                var strongText = strong.textContent.trim();
                var rest = '';
                p.childNodes.forEach(function(n) { if (n !== strong) rest += n.textContent; });
                rest = rest.trim();

                // "**Label:**  value"  — colon inside the bold
                if (strongText.endsWith(':') && rest) {
                    label = strongText.slice(0, -1).trim();
                    value = rest;
                }
                // "**Label**:  value"  — colon outside the bold
                else if (!strongText.endsWith(':') && rest.startsWith(':') && rest.length > 1) {
                    label = strongText;
                    value = rest.slice(1).trim();
                }
            }

            // plain "Label: value" with no markup at all
            if (!label) {
                var plain = p.textContent.trim();
                var m = plain.match(/^([A-Z][^:]{2,40}):\s+(.+)$/);
                if (m) {
                    label = m[1].trim();
                    value = m[2].trim();
                }
            }

            if (label && value) {
                var el;
                if (value.length > 60) {
                    el = document.createElement('div');
                    el.className = 'ai-meta-callout';
                    el.innerHTML =
                        '<div class="ai-meta-callout-label">' + label + '</div>' +
                        '<div class="ai-meta-callout-value">' + value + '</div>';
                } else {
                    el = document.createElement('span');
                    el.className = 'ai-meta-chip';
                    el.innerHTML =
                        '<span class="ai-meta-chip-label">' + label + '</span>' +
                        '<span class="ai-meta-chip-value">' + value + '</span>';
                }
                chips.push({ original: p, chip: el });
            }
        });

        if (chips.length > 0) {
            var inlineChips = chips.filter(function(c) { return c.chip.classList.contains('ai-meta-chip'); });
            var callouts = chips.filter(function(c) { return c.chip.classList.contains('ai-meta-callout'); });

            if (inlineChips.length > 0) {
                var wrap = document.createElement('div');
                wrap.className = 'ai-meta-chips';
                inlineChips[0].original.parentNode.insertBefore(wrap, inlineChips[0].original);
                inlineChips.forEach(function(c) { wrap.appendChild(c.chip); c.original.remove(); });
            }
            callouts.forEach(function(c) {
                c.original.parentNode.insertBefore(c.chip, c.original);
                c.original.remove();
            });
        }
    }

    function stylePillLists(div) {
        div.querySelectorAll('ul').forEach(function(ul) {
            var items = Array.from(ul.querySelectorAll(':scope > li'));
            if (items.length === 0) return;
            var allLinks = items.every(function(li) {
                var links = li.querySelectorAll('a');
                return links.length === 1 && li.textContent.trim() === links[0].textContent.trim();
            });
            if (allLinks) {
                ul.classList.add('pill-list');
                items.forEach(function(li) {
                    var a = li.querySelector('a');
                    if (a.getAttribute('href') && a.getAttribute('href').indexOf('add_edit_event.php') !== -1) {
                        a.removeAttribute('target');
                        a.addEventListener('click', function(e) {
                            e.preventDefault();
                            top.dlgopen(a.getAttribute('href'), '_blank', 780, 675, '', '', {});
                        });
                    } else {
                        a.setAttribute('target', '_blank');
                    }
                });
            }
        });
    }

    function appendMessage(text, role, meta) {
        var div = document.createElement('div');
        div.className = 'ai-msg ' + role;
        if (meta && meta.escalated) div.classList.add('escalated');
        if (role === 'assistant') {
            div.innerHTML = DOMPurify.sanitize(marked.parse(text));
            styleMetadataChips(div);
            stylePillLists(div);
        } else {
            div.textContent = text;
        }
        messages.appendChild(div);
        if (meta && meta.confidenceScore !== undefined) {
            var m = document.createElement('div');
            m.className = 'ai-msg-meta';
            var metaText = document.createTextNode('Confidence: ' + meta.confidenceScore + '%' + (meta.escalated ? ' ⚠ Review recommended' : ''));
            m.appendChild(metaText);
            if (meta.escalated) {
                var btn = document.createElement('button');
                btn.className = 'ai-escalate-btn';
                btn.innerHTML = '🚨 Escalate';
                btn.addEventListener('click', function() {
                    var pid = '';
                    try { pid = app_view_model.application_data.patient().pid(); } catch(e) {}
                    var url = top.webroot_url + '/interface/main/messages/messages.php?task=addnew&form_active=1' + (pid ? '&pid=' + encodeURIComponent(pid) : '');
                    top.dlgopen(url, 'ai_escalate', 'modal-lg', 500, '', '<?php echo xla('Escalate for Review'); ?>', { allowDrag: true, allowResize: true });
                });
                m.appendChild(btn);
            }
            messages.appendChild(m);
        }
        messages.scrollTop = messages.scrollHeight;
        return div;
    }

    function appendFeedbackRow(spanId) {
        var row = document.createElement('div');
        row.className = 'ai-feedback-row';

        var up = document.createElement('button');
        up.className = 'ai-feedback-btn';
        up.type = 'button';
        up.title = 'Helpful';
        up.textContent = '👍';

        var down = document.createElement('button');
        down.className = 'ai-feedback-btn';
        down.type = 'button';
        down.title = 'Not helpful';
        down.textContent = '👎';

        var thanks = document.createElement('span');
        thanks.className = 'ai-feedback-thanks';
        thanks.style.display = 'none';
        thanks.textContent = 'Thanks for the feedback';

        function sendFeedback(score) {
            up.disabled = true;
            down.disabled = true;
            thanks.style.display = 'inline';
            if (!spanId) return;
            fetch(FEEDBACK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ spanId: spanId, score: score })
            }).catch(function () {});
        }

        up.addEventListener('click', function () { sendFeedback(1); });
        down.addEventListener('click', function () { sendFeedback(-1); });

        row.appendChild(up);
        row.appendChild(down);
        row.appendChild(thanks);
        messages.appendChild(row);
        messages.scrollTop = messages.scrollHeight;
    }

    function setLoading(on) {
        send.disabled = on;
        input.disabled = on;
        send.innerHTML = on
            ? '<span class="spinner-border spinner-border-sm"></span>'
            : '<i class="fas fa-paper-plane mr-1"></i><?php echo xlt('Send'); ?>';
    }

    function getPatientContext() {
        try {
            var pt = app_view_model.application_data.patient();
            if (!pt || !pt.pid()) return Promise.resolve(null);
            var base = { pid: pt.pid(), name: pt.pname(), pubpid: pt.pubpid(), dob: pt.str_dob() };
            var url = '<?php echo $webroot; ?>/interface/main/tabs/ai_patient_context.php'
                + '?pid=' + encodeURIComponent(pt.pid())
                + '&csrf_token=' + encodeURIComponent('<?php echo attr(CsrfUtils::collectCsrfToken()); ?>');
            return fetch(url)
                .then(function(r) { return r.ok ? r.json() : {}; })
                .then(function(data) {
                    base.medications = data.medications || [];
                    base.problems = data.problems || [];
                    return base;
                })
                .catch(function() { return base; });
        } catch (e) { return Promise.resolve(null); }
    }

    function sendMessage() {
        var text = input.value.trim();
        if (!text) return;
        input.value = '';
        appendMessage(text, 'user');
        setLoading(true);

        getPatientContext().then(function(patientContext) {
        return fetch(AGENT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, sessionId: SESSION_ID, patientContext: patientContext })
        })
        .then(function (r) { return r.json(); })
        .then(function (data) {
            appendToolCalls(data.toolCalls);
            appendMessage(data.text, 'assistant', { escalated: data.escalated, confidenceScore: data.confidenceScore });
            appendFeedbackRow(data.spanId);
        })
        .catch(function () {
            appendMessage('<?php echo xlt('Could not reach AI assistant. Make sure the agent server is running.'); ?>', 'assistant');
        })
        .finally(function () { setLoading(false); });
        }); // end getPatientContext().then
    }

    window.openAiAssistantWithPrompt = function(promptText) {
        openPanel();
        if (typeof promptText !== 'string') {
            return;
        }
        var text = promptText.trim();
        if (!text) {
            return;
        }
        input.value = text;
        sendMessage();
    };
})();
</script>
</body>

</html>
