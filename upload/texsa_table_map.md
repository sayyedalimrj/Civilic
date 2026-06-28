# نقشه جدول‌های خروجی تکسا

این فایل از روی خروجی واقعی `.svzt` ساخته شده و برای طراحی دیتابیس/ایمپورت/اکسپورت نسخه آنلاین تکسا استفاده می‌شود.

| ردیف | نام جدول | تعداد ردیف در فایل نمونه | تعداد ستون | کاربرد پیشنهادی |
|---:|---|---:|---:|---|
| 1 | `BaseSituNoe` | 3 | 3 | داده پایه/تخصصی تکسا؛ باید خام حفظ شود |
| 2 | `base_PersonalityTyp` | 7 | 5 | داده پایه/تخصصی تکسا؛ باید خام حفظ شود |
| 3 | `BaseBarcode` | 1000 | 5 | بارکد/نوع سند |
| 4 | `base_TajhzType` | 4 | 2 | داده پایه/تخصصی تکسا؛ باید خام حفظ شود |
| 5 | `Base_Months` | 13 | 2 | ماه‌ها |
| 6 | `base_ShakhesType` | 2 | 2 | داده پایه/تخصصی تکسا؛ باید خام حفظ شود |
| 7 | `Base_ItemType` | 6 | 5 | نوع آیتم |
| 8 | `base_unit` | 1802 | 3 | واحدها |
| 9 | `base_tyun` | 8 | 3 | داده پایه/تخصصی تکسا؛ باید خام حفظ شود |
| 10 | `base_zrtj` | 18 | 3 | داده پایه/تخصصی تکسا؛ باید خام حفظ شود |
| 11 | `base_IntpVaziat` | 3 | 2 | داده پایه/تخصصی تکسا؛ باید خام حفظ شود |
| 12 | `brv_color` | 16 | 6 | داده پایه/تخصصی تکسا؛ باید خام حفظ شود |
| 13 | `base_acts_unit` | 203 | 3 | داده پایه/تخصصی تکسا؛ باید خام حفظ شود |
| 14 | `brv_contract` | 1 | 161 | اطلاعات اصلی پروژه/پیمان |
| 15 | `brv_elhagh` | 1 | 5 | داده پایه/تخصصی تکسا؛ باید خام حفظ شود |
| 16 | `brv_type` | 3 | 11 | طرفین و نقش‌ها |
| 17 | `brv_situ` | 21 | 6 | نوع وضعیت: موقت، ماقبل قطعی، قطعی |
| 18 | `brv_intp` | 7 | 24 | دوره/شاخص تعدیل |
| 19 | `brv_kosorat` | 360 | 10 | کسورات صورت‌وضعیت |
| 20 | `brv_ahta` | 781 | 46 | ردیف‌های تعدیل |
| 21 | `brv_acts` | 122 | 30 | فعالیت‌ها/WBS/برنامه زمانی |
| 22 | `brv_type_situ` | 33 | 41 | تعریف دوره‌ها/نوع صورت‌وضعیت/قفل/تاریخ‌ها |
| 23 | `brv_fhpy` | 183 | 286 | رشته فهرست‌بها و ضرایب کلی |
| 24 | `brv_mult` | 6705 | 198 | فصول/ساختار چندسطحی و ضرایب |
| 25 | `brv_grop` | 1830 | 10 | گروه‌بندی‌ها |
| 26 | `brv_mogs` | 954 | 14 | موقعیت/عامل اجرایی متره |
| 27 | `brv_fhbh` | 5116 | 29 | آیتم‌های فهرست‌بها |
| 28 | `brv_rzmt` | 8551 | 37 | ریزمتره |
| 29 | `brv_ader` | 4411 | 12 | داده پایه/تخصصی تکسا؛ باید خام حفظ شود |
| 30 | `brv_khmt` | 7726 | 22 | خلاصه متره |
| 31 | `brv_bgml` | 2122 | 32 | برگه مالی و مقادیر/مبالغ |
| 32 | `brv_hmbs` | 757 | 18 | مبانی/خلاصه حمل |
| 33 | `brv_dstb` | 1297 | 16 | بازه‌های مسافت و ضرایب |
| 34 | `brv_hmpy` | 711 | 11 | حمل پای کار |
| 35 | `brv_hmpy_rzmt` | 3382 | 12 | حمل مرتبط با ریزمتره |
| 36 | `brv_dstn_main` | 960 | 10 | مسافت اصلی حمل |
| 37 | `brv_dstn_fromto` | 122 | 16 | از/تا در حمل |
| 38 | `brv_dstn_main_rzmt` | 28652 | 11 | مسافت حمل مرتبط با ریزمتره |
| 39 | `brv_dstn_fromto_rzmt` | 66 | 17 | از/تا حمل ریزمتره |
| 40 | `brv_sorc_all` | 155 | 12 | فهرست منابع/مصالح |
| 41 | `brv_sorc` | 155 | 9 | نرخ منابع/مصالح |
| 42 | `brv_nmmhb` | 155 | 15 | مصالح/منابع متصل به آیتم‌ها |
| 43 | `brv_Jobrankosoorat` | 186 | 9 | کسورات جانبی/کارکرد |
| 44 | `brv_Arzkosoorat` | 186 | 9 | کسورات ارزی/جانبی |
| 45 | `brv_Tadilkosorat` | 192 | 9 | کسورات تعدیل |

## ستون‌های هر جدول

### `BaseSituNoe`

`Id`, `StnCode`, `StnName`

### `base_PersonalityTyp`

`pty_id`, `pty_Name`, `pty_isSystem`, `PtyOrder`, `ptyShow`

### `BaseBarcode`

`Id`, `IsActive`, `OrderBbc`, `BbcCode`, `BbcName`

### `base_TajhzType`

`tjt_id`, `tjt_name`

### `Base_Months`

`mon_id`, `mon_name`

### `base_ShakhesType`

`Sht_id`, `Sht_Name`

### `Base_ItemType`

`Ity_id`, `Ity_name`, `Ity_Code`, `ity_Summ`, `Ity_ShowInList`

### `base_unit`

`unt_id`, `unt_unit`, `unt_rad`

### `base_tyun`

`tyn_id`, `tyn_tyun`, `tyn_tyun_vb6`

### `base_zrtj`

`zrt_id`, `zrt_rad`, `zrt_zrpr`

### `base_IntpVaziat`

`itv_id`, `itv_Name`

### `brv_color`

`col_name_far`, `col_rad`, `col_name_eng`, `col_red`, `col_green`, `col_blue`

### `base_acts_unit`

`acu_unit_id`, `acu_unit`, `acu_rad`

### `brv_contract`

`ctc_id`, `ctc_project_type`, `ctc_archive`, `ctc_copj`, `ctc_rad`, `ctc_nmpj`, `ctc_yrfh`, `ctc_parent`, `ctc_nmcs`, `ctc_nmct`, `ctc_nmci`, `ctc_Etebar_Omomi`, `ctc_acon`, `ctc_tdil`, `ctc_tdil_psn`, `ctc_tdnr`, `ctc_tdty`, `ctc_prbs`, `ctc_yrbd`, `ctc_prja`, `ctc_yrja`, `ctc_prbs_svz`, `ctc_yrbd_svz`, `ctc_ShEb_Yr`, `ctc_ShEb_Sm`, `ctc_End_brv`, `ctc_N`, `ctc_onta`, `ctc_cota`, `ctc_onpj`, `ctc_coon`, `ctc_sand`, `ctc_sand_svz`, `ctc_sand_psn`, `ctc_dtbv`, `ctc_neza`, `ctc_mont`, `ctc_days`, `ctc_area`, `ctc_plpj`, `ctc_mjta`, `ctc_rsmo`, `ctc_mota`, `ctc_etmo`, `ctc_dscr`, `mog_zrib1_tit`, `mog_zrib2_tit`, `mog_zrib3_tit`, `ctc_AnalyzeType`, `ctc_AnalyzeAll`, `ctc_AnalyzeNote`, `ctc_IsLocked`, `ctc_Pass_Lock`, `ctc_User_Lock`, `ctc_type_tjhz`, `ctc_rzmt_tgnu`, `ctc_rzmt_tgtl`, `ctc_rzmt_tgaz`, `ctc_rzmt_tght`, `ctc_rzmt_tgwg`, `ctc_rzmt_tgjz`, `ctc_rzmt_tgjk`, `ctc_khmt_tgjz`, `ctc_khmt_tgjr`, `ctc_khmt_tgjk`, `ctc_khmt_tgmo_k123`, `ctc_khmt_tgmo`, `ctc_bgml_brqn`, `ctc_bgml_dnqn`, `ctc_bgml_dnpr`, `ctc_bgml_pcun`, `ctc_bgml_65_pcun`, `ctc_bgml_wgpr`, `ctc_bgml_roshd`, `ctc_seas_wgpr`, `ctc_seas_dnpr`, `ctc_note_wgpr`, `ctc_note_dnpr`, `ctc_haml_kzrb`, `ctc_haml_tzrb`, `ctc_haml_quan`, `ctc_haml_tgjm`, `ctc_dist_dist`, `ctc_dist_i`, `ctc_fosi_quan`, `ctc_fosi_pert`, `ctc_fosi_nrkh`, `ctc_fosi_sal`, `ctc_fosi_ksrt`, `ctc_anab_wgpr`, `ctc_anab_quan`, `ctc_anab_pcun`, `ctc_anab_zrib`, `ctc_anab_pcal`, `ctc_anab_zrib_ralc`, `ctc_anab_grpr`, `ctc_sorc_pcun`, `ctc_sorc_quan`, `ctc_sorc_wgpr`, `ctc_acts_phpr`, `ctc_acts_dnpr`, `ctc_acts_wgpr`, `ctc_acts_pcun`, `ctc_acts_quan`, `ctc_acts_quan_sorc`, `ctc_acts_wgpr_sorc`, `ctc_koli_pcal`, `ctc_koli_pcun`, `ctc_koli_quan`, `ctc_pic_arm`, `ctc_pic_status`, `ctc_haml_from`, `ctc_numb`, `ctc_dtct`, `ctc_dtst`, `ctc_timh`, `ctc_tidy`, `ctc_timp`, `ctc_tidp`, `ctc_pric_prim`, `ctc_dend`, `ctc_pctj`, `ctc_rpt_khzr`, `ctc_rpt_wp_type`, `ctc_rpt_item`, `ctc_signatue_exist`, `ctc_tjhz_sx`, `ctc_tjhz_fc`, `ctc_tjhz_mp`, `ctc_fmul_tjhz`, `ctc_ProjectCreator`, `ctc_Description`, `ctc_prja_astr`, `ctc_yrja_astr`, `ctc_prmb_astr`, `ctc_yrmb_astr`, `ctc_Is76574`, `ctc_conc`, `ctc_CheckCodeAmel`, `ctc_atm_tg_pr`, `ctc_analyse_year`, `ctc_code`, `ctc_DateCreate`, `ctc_DateModi`, `ctc_DateRestore`, `ctc_code_Create`, `ctc_calcTadilGhir`, `ctc_restoreFromVb6`, `ctc_Shart50Item`, `ctc_hasEngFeh`, `ctc_DarsadVazniType`, `ctc_sarjam96`, `ctc_dtlastPishnahad`, `ctc_showFullDesc`, `ctc_kasrNew76574`, `ctc_ShowTypSumm`, `ctc_dteb`, `ctc_dendPrim`, `ctc_Barcode`, `ctc_unit`, `Version`

### `brv_elhagh`

`elh_link_proj`, `elh_id`, `elh_rad`, `elh_dscr`, `elh_price`

### `brv_type`

`typ_link_proj`, `typ_id`, `typ_rad`, `typ_name`, `typ_color_name_far`, `typ_name_delegate`, `typ_PrintSignature`, `typ_sum_work_ol_z`, `typ_PrintName`, `typ_absName`, `typ_PertypId`

### `brv_situ`

`stu_link_proj`, `stu_id`, `stu_rad`, `stu_numb`, `stu_Barcode`, `stu_StnId`

### `brv_intp`

`itp_link_proj`, `itp_nusv`, `itp_type`, `itp_nusv_previous`, `itp_type_previous`, `itp_num_prod`, `itp_year`, `itp_rad`, `itp_prod`, `itp_tidy`, `itp_avg`, `itp_year_shkh`, `itp_num_prod_shkh`, `itp_type_shkh`, `itp_num_type_shkh`, `itp_prod_shkh`, `itp_t`, `itp_num_mon_prod`, `itp_num_mon_shkh`, `itp_z_a`, `itp_b_a`, `itp_vaziat`, `itp_Noe`, `itp_type_current`

### `brv_kosorat`

`ksr_link_proj`, `ksr_nusv`, `ksr_type`, `ksr_id`, `ksr_rad`, `ksr_name`, `ksr_prcn`, `ksr_PlusOrMinec`, `ksr_Mablaghi`, `ksr_price`

### `brv_ahta`

`ata_link_proj`, `ata_nufh`, `ata_nuse`, `ata_nusv_previous`, `ata_type_previous`, `ata_nusv`, `ata_type`, `ata_inrd`, `ata_year`, `ata_rad`, `ata_nufh_name`, `ata_name`, `ata_pcnw`, `ata_pcol`, `ata_pcnz`, `ata_pcoz`, `ata_zrta`, `ata_tidy`, `ata_pcwp`, `ata_pcwz`, `ata_pcta`, `ata_pctz`, `ata_shnw`, `ata_shbs`, `ata_fsrs`, `ata_str_prod`, `ata_str_avg`, `ata_str_tatb`, `ata_pcnw_3m`, `ata_pcol_3m`, `ata_pcnz_3m`, `ata_pcoz_3m`, `ata_year_shkh`, `ata_prod_shkh`, `ata_pcnz_bedunebalasari`, `ata_pcoz_bedunebalasari`, `ata_inMon`, `ata_inMon_shkh`, `ata_itprad`, `ata_str_avg_mbn_99`, `ata_SahmPishPar`, `ata_No_Zero`, `ata_pcoz_compare`, `ata_str_avg_HamlExc`, `ata_nuse_real`, `ata_NuseForSh`

### `brv_acts`

`act_link_proj`, `act_coac`, `act_nusv`, `act_type`, `act_id`, `act_parent`, `act_level`, `act_rad`, `act_name`, `act_unit`, `act_zrib`, `act_prcn`, `act_prcn_ol`, `act_weit`, `act_prcf`, `act_task_type`, `act_duration`, `act_User_Edit`, `act_Start`, `act_Finish`, `act_Min_Start_User`, `act_Min_Start_CPM`, `act_IsSummery`, `act_IsPlanned`, `act_weit_koll`, `act_SetTatbighDasti`, `act_total_rad`, `IsParent`, `IsLeaf`, `NewCoac`

### `brv_type_situ`

`tst_link_proj`, `tst_nusv`, `tst_type`, `tst_rad`, `tst_date`, `tst_date_previous`, `tst_type_previous_compare`, `tst_is_locked`, `tst_lock_pass`, `tst_selected`, `tst_FirstDay_Intp`, `tst_code`, `tst_hastatbigh`, `tst_tadilmanfi`, `tst_type_current_tadil`, `tst_date_current_tadil`, `tst_PishPardakht`, `tst_PishPardakhtMande`, `tst_nusv_previous`, `tst_type_previous`, `tst_nusv_previous_tadil`, `tst_type_previous_tadil`, `tst_date_previous_tadil`, `tst_mbsv`, `tst_mbtd_sum`, `tst_mbtd_sum_rs`, `tst_mbtd_sum_previous`, `tst_mbtd_sum_previous_rs`, `tst_codeModi`, `tst_DateModi`, `tst_dateCreateAuto`, `tst_nusv_previousAuto`, `tst_type_previousAuto`, `tst_codePrjSrcCopy`, `tst_mbsv_previous`, `tst_tgrb_zrtd`, `tst_type_tdil`, `tst_zrib_tdil`, `tst_parent_nusv`, `tst_parent_type`, `tst_datetimeRestore`

### `brv_fhpy`

`fhp_link_proj`, `fhp_nufh`, `fhp_nusv`, `fhp_type`, `fhp_abst`, `fhp_dscr`, `fhp_rad`, `fhp_plmu_tit`, `fhp_loca_tit`, `fhp_heit_tit`, `fhp_taba_tit`, `fhp_hard_tit`, `fhp_tatb_tit`, `fhp_ovhd_tit`, `fhp_zrmp1_tit`, `fhp_zrmp2_tit`, `fhp_loca_tit_psn`, `fhp_heit_tit_psn`, `fhp_taba_tit_psn`, `fhp_hard_tit_psn`, `fhp_tatb_tit_psn`, `fhp_ovhd_tit_psn`, `fhp_plmu`, `fhp_plmu_s`, `fhp_plmu_fc`, `fhp_plmu_mp`, `fhp_plmu_s_mp`, `fhp_plmu_fc_mp`, `fhp_loca`, `fhp_loca_s`, `fhp_loca_fc`, `fhp_loca_mp`, `fhp_loca_s_mp`, `fhp_loca_fc_mp`, `fhp_heit`, `fhp_heit_s`, `fhp_heit_fc`, `fhp_heit_mp`, `fhp_heit_s_mp`, `fhp_heit_fc_mp`, `fhp_taba`, `fhp_taba_s`, `fhp_taba_fc`, `fhp_taba_mp`, `fhp_taba_s_mp`, `fhp_taba_fc_mp`, `fhp_hard`, `fhp_hard_s`, `fhp_hard_fc`, `fhp_hard_mp`, `fhp_hard_s_mp`, `fhp_hard_fc_mp`, `fhp_tatb`, `fhp_tatb_s`, `fhp_tatb_fc`, `fhp_tatb_mp`, `fhp_tatb_s_mp`, `fhp_tatb_fc_mp`, `fhp_oth1`, `fhp_oth1_s`, `fhp_oth1_fc`, `fhp_oth1_mp`, `fhp_oth1_s_mp`, `fhp_oth1_fc_mp`, `fhp_oth2`, `fhp_oth2_s`, `fhp_oth2_fc`, `fhp_oth2_mp`, `fhp_oth2_s_mp`, `fhp_oth2_fc_mp`, `fhp_oth3`, `fhp_oth3_s`, `fhp_oth3_fc`, `fhp_oth3_mp`, `fhp_oth3_s_mp`, `fhp_oth3_fc_mp`, `fhp_ovhd`, `fhp_ovhd_s`, `fhp_ovhd_fc`, `fhp_ovhd_mp`, `fhp_ovhd_s_mp`, `fhp_ovhd_fc_mp`, `fhp_sumz`, `fhp_sumz_s`, `fhp_sumz_fc`, `fhp_sumz_mp`, `fhp_sumz_s_mp`, `fhp_sumz_fc_mp`, `fhp_zrmp`, `fhp_zrse`, `fhp_tjhz_prcn`, `fhp_tgrb`, `fhp_loca_psn`, `fhp_loca_s_psn`, `fhp_loca_fc_psn`, `fhp_heit_psn`, `fhp_heit_s_psn`, `fhp_heit_fc_psn`, `fhp_taba_psn`, `fhp_taba_s_psn`, `fhp_taba_fc_psn`, `fhp_hard_psn`, `fhp_hard_s_psn`, `fhp_hard_fc_psn`, `fhp_tatb_psn`, `fhp_tatb_s_psn`, `fhp_tatb_fc_psn`, `fhp_oth1_psn`, `fhp_oth1_s_psn`, `fhp_oth1_fc_psn`, `fhp_oth2_psn`, `fhp_oth2_s_psn`, `fhp_oth2_fc_psn`, `fhp_oth3_psn`, `fhp_oth3_s_psn`, `fhp_oth3_fc_psn`, `fhp_ovhd_psn`, `fhp_ovhd_s_psn`, `fhp_ovhd_fc_psn`, `fhp_sumz_psn`, `fhp_sumz_s_psn`, `fhp_sumz_fc_psn`, `fhp_tgrb_psn`, `fhp_mbfh_tdil_psn`, `fhp_mb_totl_tdil_psn`, `fhp_mbfh_tdil_psn_z`, `fhp_mb_totl_tdil_psn_z`, `fhp_is_locked`, `fhp_tdil_tatb`, `fhp_rzmt_numo_header`, `fhp_rzmt_tool_header`, `fhp_rzmt_arz_header`, `fhp_rzmt_heit_header`, `fhp_rzmt_weit_header`, `fhp_2Item`, `fhp_tdil_tatb_taj_Just_RahNufh`, `fhp_mbfh`, `fhp_mbsx`, `fhp_mbfc`, `fhp_mb_totl`, `fhp_mbfh_z`, `fhp_mbsx_z`, `fhp_mbfc_z`, `fhp_mb_totl_z`, `fhp_mbfh_work`, `fhp_mbsx_work`, `fhp_mbfc_work`, `fhp_mbmp_work`, `fhp_mb_work`, `fhp_mbfh_work_z`, `fhp_mbsx_work_z`, `fhp_mbfc_work_z`, `fhp_mbmp_work_z`, `fhp_mb_work_z`, `fhp_pr_work`, `fhp_pr_work_z`, `fhp_mbtj_work`, `fhp_mbtj_fmul_work`, `fhp_mbfh_work_tatb`, `fhp_mbsx_work_tatb`, `fhp_mbfc_work_tatb`, `fhp_mbmp_work_tatb`, `fhp_mb_work_tatb`, `fhp_mbfh_work_tatb_z`, `fhp_mbsx_work_tatb_z`, `fhp_mbfc_work_tatb_z`, `fhp_mbmp_work_tatb_z`, `fhp_mb_work_tatb_z`, `fhp_mbtj_work_tatb`, `fhp_fzkh_new`, `fhp_fzkh`, `fhp_fzkh_fznew`, `fhp_fzkh_kh`, `fhp_fzkh_sum`, `fhp_fzkh_new_z`, `fhp_fzkh_z`, `fhp_fzkh_fznew_z`, `fhp_fzkh_kh_z`, `fhp_fzkh_sum_z`, `fhp_mbfh_tdil`, `fhp_mbsx_tdil`, `fhp_mb_totl_tdil`, `fhp_mbfh_tdil_z`, `fhp_mbsx_tdil_z`, `fhp_mb_totl_tdil_z`, `fhp_mb49`, `fhp_mbtj`, `fhp_mbtj_fmul`, `fhp_tl49`, `fhp_mb_loca_fh`, `fhp_mb_loca_sx`, `fhp_mb_loca`, `fhp_mb_heit_fh`, `fhp_mb_heit_sx`, `fhp_mb_heit`, `fhp_mb_taba_fh`, `fhp_mb_taba_sx`, `fhp_mb_taba`, `fhp_mb_hard_fh`, `fhp_mb_hard_sx`, `fhp_mb_hard`, `fhp_mb_tatb_fh`, `fhp_mb_tatb_sx`, `fhp_mb_tatb`, `fhp_mb_oth1_fh`, `fhp_mb_oth1_sx`, `fhp_mb_oth1`, `fhp_mb_oth2_fh`, `fhp_mb_oth2_sx`, `fhp_mb_oth2`, `fhp_mb_oth3_fh`, `fhp_mb_oth3_sx`, `fhp_mb_oth3`, `fhp_mb_ovhd_fh`, `fhp_mb_ovhd_sx`, `fhp_mb_ovhd`, `fhp_mb_sumz_fh`, `fhp_mb_sumz_sx`, `fhp_mb_sumz`, `fhp_mb_loca_fh_psn`, `fhp_mb_loca_sx_psn`, `fhp_mb_loca_psn`, `fhp_mb_heit_fh_psn`, `fhp_mb_heit_sx_psn`, `fhp_mb_heit_psn`, `fhp_mb_taba_fh_psn`, `fhp_mb_taba_sx_psn`, `fhp_mb_taba_psn`, `fhp_mb_hard_fh_psn`, `fhp_mb_hard_sx_psn`, `fhp_mb_hard_psn`, `fhp_mb_tatb_fh_psn`, `fhp_mb_tatb_sx_psn`, `fhp_mb_tatb_psn`, `fhp_mb_oth1_fh_psn`, `fhp_mb_oth1_sx_psn`, `fhp_mb_oth1_psn`, `fhp_mb_oth2_fh_psn`, `fhp_mb_oth2_sx_psn`, `fhp_mb_oth2_psn`, `fhp_mb_oth3_fh_psn`, `fhp_mb_oth3_sx_psn`, `fhp_mb_oth3_psn`, `fhp_mb_ovhd_fh_psn`, `fhp_mb_ovhd_sx_psn`, `fhp_mb_ovhd_psn`, `fhp_mb_sumz_fh_psn`, `fhp_mb_sumz_sx_psn`, `fhp_mb_sumz_psn`, `fhp_mb49_psn`, `fhp_mbtj_psn`, `fhp_mbtj_fmul_psn`, `fhp_tl49_psn`, `fhp_roshd_49`, `fhp_mbfh_psn`, `fhp_mbsx_psn`, `fhp_mbfc_psn`, `fhp_mb_totl_psn`, `fhp_roshd`, `fhp_roshd_tdil`, `fhp_mbfh_psn_z`, `fhp_mbsx_psn_z`, `fhp_mbfc_psn_z`, `fhp_mb_totl_psn_z`, `fhp_roshd_z`, `fhp_zrib_z`, `fhp_roshd_tdil_z`, `fhp_mbsx_tdil_psn`, `fhp_roshd_tdil_psn`, `fhp_mbsx_tdil_psn_z`, `fhp_roshd_tdil_psn_z`, `fhp_mb_khtd`, `fhp_mb_khtd_rs`, `fhp_mbfh_sxmb_work`, `fhp_mbfh_sxmb_work_z`, `fhp_mb_work_tatb_z_bedunebalasari`, `fhp_mbtj_work_tatb_bedunebalasari`, `fhp_fzkh_new_z_taj`, `fhp_fzkh_z_taj`, `fhp_fzkh_kh_z_taj`, `fhp_fzkh_fznew_z_taj`, `fhp_fzkh_sum_z_taj`, `fhp_mb_work_ol`, `fhp_mb_work_ol_z`, `fhp_mbtj_work_ol`, `fhp_oth1_tit`

### `brv_mult`

`mlt_link_proj`, `mlt_nufh`, `mlt_nuse`, `mlt_nusv`, `mlt_type`, `mlt_is_tjhz`, `mlt_name`, `mlt_rad`, `mlt_plmu`, `mlt_plmu_s`, `mlt_plmu_fc`, `mlt_plmu_mp`, `mlt_plmu_s_mp`, `mlt_plmu_fc_mp`, `mlt_loca`, `mlt_loca_s`, `mlt_loca_fc`, `mlt_loca_mp`, `mlt_loca_s_mp`, `mlt_loca_fc_mp`, `mlt_heit`, `mlt_heit_s`, `mlt_heit_fc`, `mlt_heit_mp`, `mlt_heit_s_mp`, `mlt_heit_fc_mp`, `mlt_taba`, `mlt_taba_s`, `mlt_taba_fc`, `mlt_taba_mp`, `mlt_taba_s_mp`, `mlt_taba_fc_mp`, `mlt_hard`, `mlt_hard_s`, `mlt_hard_fc`, `mlt_hard_mp`, `mlt_hard_s_mp`, `mlt_hard_fc_mp`, `mlt_tatb`, `mlt_tatb_s`, `mlt_tatb_fc`, `mlt_tatb_mp`, `mlt_tatb_s_mp`, `mlt_tatb_fc_mp`, `mlt_ovhd`, `mlt_ovhd_s`, `mlt_ovhd_fc`, `mlt_ovhd_mp`, `mlt_ovhd_s_mp`, `mlt_ovhd_fc_mp`, `mlt_oth1`, `mlt_oth1_s`, `mlt_oth1_fc`, `mlt_oth1_mp`, `mlt_oth1_s_mp`, `mlt_oth1_fc_mp`, `mlt_oth2`, `mlt_oth2_s`, `mlt_oth2_fc`, `mlt_oth2_mp`, `mlt_oth2_s_mp`, `mlt_oth2_fc_mp`, `mlt_oth3`, `mlt_oth3_s`, `mlt_oth3_fc`, `mlt_oth3_mp`, `mlt_oth3_s_mp`, `mlt_oth3_fc_mp`, `mlt_zrmp_70`, `mlt_zrmp_70_s`, `mlt_zrmp_70_fc`, `mlt_zrmp_mp`, `mlt_zrmp_s_mp`, `mlt_zrmp_fc_mp`, `mlt_zrmp_70_mp`, `mlt_zrmp_70_s_mp`, `mlt_zrmp_70_fc_mp`, `mlt_sumz`, `mlt_sumz_s`, `mlt_sumz_fc`, `mlt_sumz_mp`, `mlt_sumz_s_mp`, `mlt_sumz_fc_mp`, `mlt_loca_psn`, `mlt_loca_s_psn`, `mlt_loca_fc_psn`, `mlt_heit_psn`, `mlt_heit_s_psn`, `mlt_heit_fc_psn`, `mlt_taba_psn`, `mlt_taba_s_psn`, `mlt_taba_fc_psn`, `mlt_hard_psn`, `mlt_hard_s_psn`, `mlt_hard_fc_psn`, `mlt_tatb_psn`, `mlt_tatb_s_psn`, `mlt_tatb_fc_psn`, `mlt_ovhd_psn`, `mlt_ovhd_s_psn`, `mlt_ovhd_fc_psn`, `mlt_oth1_psn`, `mlt_oth1_s_psn`, `mlt_oth1_fc_psn`, `mlt_oth2_psn`, `mlt_oth2_s_psn`, `mlt_oth2_fc_psn`, `mlt_oth3_psn`, `mlt_oth3_s_psn`, `mlt_oth3_fc_psn`, `mlt_sumz_psn`, `mlt_sumz_s_psn`, `mlt_sumz_fc_psn`, `ses_49tl_psn`, `ses_pctl_psn_z`, `ses_pcfh_tdil_psn`, `ses_pctl_tdil_psn`, `ses_pcfh_tdil_psn_z`, `ses_pctl_tdil_psn_z`, `mlt_sumz_str`, `mlt_sumz_s_str`, `mlt_sumz_fc_str`, `mlt_sumz_mp_str`, `mlt_sumz_s_mp_str`, `mlt_sumz_fc_mp_str`, `ses_pcfh`, `ses_pcsx`, `ses_pcfc`, `ses_pctl`, `ses_pcfh_z`, `ses_pcsx_z`, `ses_pcfc_z`, `ses_pctl_z`, `ses_pcfh_work`, `ses_pcsx_work`, `ses_pcfc_work`, `ses_pcmp_work`, `ses_pcwo`, `ses_pcfh_work_tatb`, `ses_pcsx_work_tatb`, `ses_pcfc_work_tatb`, `ses_pcmp_work_tatb`, `ses_pctl_work_tatb`, `ses_pcwo_ol`, `ses_prcn_wo`, `ses_pcfh_work_z`, `ses_pcfh_work_z_fmul`, `ses_pcsx_work_z`, `ses_pcsx_work_z_fmul`, `ses_pcfc_work_z`, `ses_pcmp_work_z`, `ses_pcwo_z`, `ses_pcfh_work_tatb_z`, `ses_pcfh_work_tatb_z_fmul`, `ses_pcsx_work_tatb_z`, `ses_pcsx_work_tatb_z_fmul`, `ses_pcfc_work_tatb_z`, `ses_pcmp_work_tatb_z`, `ses_pctl_work_tatb_z`, `ses_pcmp_tatb_ol_z`, `ses_pctl_tatb_ol_z`, `ses_pcwo_ol_z`, `ses_prcn_wo_z`, `ses_pcwo_new`, `ses_pcwo_afza`, `ses_pcwo_fznew`, `ses_pcwo_kahe`, `ses_sum_afkh`, `ses_pcwo_new_z`, `ses_pcwo_afza_z`, `ses_pcwo_fznew_z`, `ses_pcwo_kahe_z`, `ses_sum_afkh_z`, `ses_pcfh_psn`, `ses_pcsx_psn`, `ses_pcfc_psn`, `ses_pcmp_psn`, `ses_pctl_psn`, `ses_pcfh_psn_z`, `ses_pcsx_psn_z`, `ses_pcfc_psn_z`, `ses_pcmp_psn_z`, `ses_pcfh_sxmb_work`, `ses_pcfh_sxmb_work_z`, `ses_pctl_work_tatb_z_beduneBalasari`, `ses_pcfh_work_tatb_z_bedunebalasari`, `ses_pcsx_work_tatb_z_bedunebalasari`, `ses_pcfc_work_tatb_z_bedunebalasari`, `ses_pcmp_work_tatb_z_bedunebalasari`, `ses_pcwo_HamlItm`, `ses_pcwo_z_HamlItm`, `ses_prwo`, `ses_prwo_z`, `ses_fmulAfzKshJamJabriKsh_Z`, `ses_fmulAfzKshJamJabriAfza_Z`, `mlt_ityId`, `mlt_Prnuse`, `mlt_Prname`

### `brv_grop`

`grp_link_proj`, `grp_nufh`, `grp_id`, `grp_nusv`, `grp_type`, `grp_grop`, `grp_rad`, `grp_HamlCalc1R`, `grp_fullDesc`, `grp_NoMahdoodiat`

### `brv_mogs`

`mog_link_proj`, `mog_id`, `mog_nusv`, `mog_type`, `mog_name`, `mog_rad`, `mog_zrib`, `mog_sj_ok`, `mog_IsBold`, `mog_isColor`, `mog_link_previous`, `mog_type_previous`, `mog_nusj`, `mog_dscr`

### `brv_fhbh`

`fbh_link_proj`, `fbh_nufh`, `fbh_nuse`, `fbh_cofh`, `fbh_nusv`, `fbh_type`, `fbh_astr`, `fbh_fact`, `fbh_mbgh`, `fbh_desc`, `fbh_abst`, `fbh_unit`, `fbh_tyun`, `fbh_pcun`, `fbh_pcun_fmul`, `fbh_pcun_ana_net`, `fbh_pcun_ana_amar`, `fbh_pcun_ana_rooz`, `fbh_notd`, `fbh_ader`, `fbh_pcun_ana_zrib`, `fbh_prja`, `fbh_yrja`, `fbh_Monja`, `fbh_prCofh`, `fbh_FromBaseReal`, `fbh_NoPcunFromBase`, `fbh_NuseForSh`, `fbh_tose`

### `brv_rzmt`

`rmt_link_proj`, `rmt_nusv`, `rmt_type`, `rmt_id`, `rmt_nufh`, `rmt_nuse`, `rmt_cofh`, `rmt_link_mog`, `rmt_fare`, `rmt_rad`, `rmt_raj`, `rmt_sumj`, `rmt_sumt`, `rmt_summ`, `rmt_coac`, `rmt_is_equal_ader`, `rmt_mpwk`, `rmt_sooratjalase_view`, `rmt_sooratjalase_view1`, `rmt_sooratjalase_view2`, `rmt_from_haml`, `rmt_dsam`, `rmt_weit`, `rmt_numo`, `rmt_tool`, `rmt_arz`, `rmt_heit`, `rmt_dsmo`, `rmt_tool_fmul`, `rmt_arz_fmul`, `rmt_heit_fmul`, `rmt_weit_fmul`, `rmt_haml_mog`, `rmt_link_previous`, `rmt_type_previous`, `rmt_sumj_fmul`, `rmt_numo_fmul`

### `brv_ader`

`adr_link_proj`, `adr_nufh`, `adr_nuse_moth`, `adr_nuse`, `adr_cofh_moth`, `adr_cofh`, `adr_nusv`, `adr_type`, `adr_fmul_tbdl`, `adr_pric_or_quan`, `adr_param_dscr`, `adr_mola`

### `brv_khmt`

`kmt_link_proj`, `kmt_nusv`, `kmt_type`, `kmt_id`, `kmt_nufh`, `kmt_nuse`, `kmt_cofh`, `kmt_nagl_rzmt`, `kmt_link_mog`, `kmt_rad`, `kmt_raj`, `kmt_sumj`, `kmt_sujz`, `kmt_sumt`, `kmt_coac`, `kmt_is_equal_ader`, `kmt_mpwk`, `kmt_nusj`, `kmt_dtsj`, `kmt_From_Haml`, `kmt_link_previous`, `kmt_type_previous`

### `brv_bgml`

`bgm_link_proj`, `bgm_nusv`, `bgm_type`, `bgm_id`, `bgm_nufh`, `bgm_cofh`, `bgm_coac`, `bgm_rad`, `bgm_nuse`, `bgm_quan`, `bgm_qust`, `bgm_pcal`, `bgm_pcal_psn`, `bgm_pcst`, `bgm_pcst_psn`, `bgm_prcn`, `bgm_swf2`, `bgm_qufz`, `bgm_pcfz`, `bgm_qukh`, `bgm_pckh`, `bgm_IsAnalyzed`, `bgm_is_equal_ader`, `bgm_mpwk`, `bgm_qust_ol`, `bgm_pcst_ol`, `bgm_no_tjhz`, `bgm_no_tatbigh_in_cnv`, `bgm_CreatInBgml`, `bgm_From_Haml`, `bgm_link_previous`, `bgm_type_previous`

### `brv_hmbs`

`hmb_link_proj`, `hmb_nufh`, `hmb_nuse`, `hmb_cofh`, `hmb_link_grop`, `hmb_dscr`, `hmb_nusv`, `hmb_type`, `hmb_zar1`, `hmb_sumz`, `hmb_checked`, `hmb_zar3`, `hmb_zar2`, `hmb_dsz2`, `hmb_zar4`, `hmb_dsz4`, `hmb_dsz1`, `hmb_dsz3`

### `brv_dstb`

`dsb_link_proj`, `dsb_link_grop`, `dsb_nufh`, `dsb_frkm`, `dsb_nusv`, `dsb_type`, `dsb_nuse`, `dsb_cofh`, `dsb_tokm`, `dsb_zrib`, `dsb_khaki_onvan`, `dsb_khaki_zarib`, `dsb_sheni_onvan`, `dsb_sheni_zarib`, `dsb_other_onvan`, `dsb_other_zarib`

### `brv_hmpy`

`hmp_link_proj`, `hmp_nufh`, `hmp_nuse`, `hmp_cofh`, `hmp_link_grop`, `hmp_dscr`, `hmp_nusv`, `hmp_type`, `hmp_rad`, `hmp_quan`, `hmp_totl`

### `brv_hmpy_rzmt`

`hmp_link_proj`, `hmp_nufh`, `hmp_nuse`, `hmp_cofh`, `hmp_link_grop`, `hmp_dscr`, `hmp_link_mog`, `hmp_nusv`, `hmp_type`, `hmp_rad`, `hmp_quan`, `hmp_totl`

### `brv_dstn_main`

`dsn_link_proj`, `dsn_id`, `dsn_nusv`, `dsn_type`, `dsn_nufh`, `dsn_link_grop`, `dsn_sum_m`, `dsn_dstn`, `dsn_sum_i`, `dsn_fromto`

### `brv_dstn_fromto`

`dsf_link_proj`, `dsf_link_grop`, `dsf_link_main`, `dsf_nufh`, `dsf_frkm`, `dsf_nusv`, `dsf_type`, `dsf_cofh`, `dsf_nuse`, `dsf_tokm`, `dsf_zrib`, `dsf_sum_i`, `dsf_sum_k_i`, `dsf_Formul`, `dsf_tokmReal`, `dsf_type1_km`

### `brv_dstn_main_rzmt`

`dsn_link_proj`, `dsn_link_mog`, `dsn_id`, `dsn_nusv`, `dsn_type`, `dsn_nufh`, `dsn_link_grop`, `dsn_sum_m`, `dsn_dstn`, `dsn_sum_i`, `dsn_fromto`

### `brv_dstn_fromto_rzmt`

`dsf_link_proj`, `dsf_link_main`, `dsf_link_mog`, `dsf_link_grop`, `dsf_nufh`, `dsf_frkm`, `dsf_nusv`, `dsf_type`, `dsf_cofh`, `dsf_nuse`, `dsf_tokm`, `dsf_zrib`, `dsf_sum_i`, `dsf_sum_k_i`, `dsf_Formul`, `dsf_type1_km`, `dsf_tokmReal`

### `brv_sorc_all`

`src_link_proj`, `src_nusv`, `src_type`, `src_id`, `src_grop`, `src_dscr`, `src_unit`, `src_pcun_net`, `src_pcun_amar`, `src_pcun_rooz`, `src_code_amel`, `src_Tajmi`

### `brv_sorc`

`src_link_proj`, `src_link_sorclist`, `src_nufh`, `src_nusv`, `src_type`, `src_pcun_net`, `src_date_amar`, `src_Tajmi`, `src_pcun_amar`

### `brv_nmmhb`

`nmb_link_proj`, `nmb_link_sorclist`, `nmb_nufh`, `nmb_nuse`, `nmb_cofh`, `nmb_nusv`, `nmb_type`, `nmb_rad`, `nmb_quan`, `nmb_zrib`, `nmb_Tajmi`, `nmb_megias`, `nmb_quan_kol`, `nmb_quan_kol_Meghyas`, `nmb_quan_nft`

### `brv_Jobrankosoorat`

`tkr_link_proj`, `tkr_nusv`, `tkr_type`, `tkr_id`, `tkr_rad`, `tkr_name`, `tkr_prcn`, `tkr_PlusOrMinec`, `Tkr_Mablaghi`

### `brv_Arzkosoorat`

`tkr_link_proj`, `tkr_nusv`, `tkr_type`, `tkr_id`, `tkr_rad`, `tkr_name`, `tkr_prcn`, `tkr_PlusOrMinec`, `Tkr_Mablaghi`

### `brv_Tadilkosorat`

`Tkr_link_proj`, `Tkr_nusv`, `Tkr_type`, `Tkr_id`, `Tkr_rad`, `Tkr_name`, `Tkr_prcn`, `Tkr_PlusOrMinec`, `Tkr_Mablaghi`

