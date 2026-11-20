/* This is tigress.h */

/*******************************************************************************/
/* Tigress generates function prototypes that Windows has deprecated.          */
/* This definition is needed to allow the transformed code to compile.         */
/*******************************************************************************/
#ifdef _MSC_VER
#define _CRT_SECURE_NO_WARNINGS 1
#endif
/*******************************************************************************/
/* We don't support clang extensions.                                          */
/*  https://clang.llvm.org/docs/BlockLanguageSpec.html#the-block-type          */
/*******************************************************************************/

#ifdef __clang__ 
#undef __BLOCKS__
#endif

/*******************************************************************************/
/* User annotations.                                                           */
/*******************************************************************************/

#define TIGRESS_IDENT(x) x
#define TIGRESS_QUOTE(x) #x
#define TIGRESS_STR(x) TIGRESS_QUOTE(x)

#define TIGRESS_CHECKSUM_INSERT asm volatile ("##_ANNOTATION_CHECKSUM_INSERT");
#define TIGRESS_ADDOPAQUE_INSERT asm volatile ("##_ANNOTATION_ADDOPAQUE_INSERT");

#define TIGRESS_REGION_BEGIN(v) {asm volatile (TIGRESS_IDENT("##_ANNOTATION_REGION_BEGIN_") TIGRESS_STR(v))};
#define TIGRESS_REGION_END(v) {asm volatile (TIGRESS_IDENT("##_ANNOTATION_REGION_END_")TIGRESS_STR(v))};

#define TIGRESS_REGION(v,s) do {\
   asm volatile (TIGRESS_IDENT("##_ANNOTATION_USERREGION_") TIGRESS_STR(v)); \
   s \
} while (0)

#define TIGRESS_ATOMIC_REGION(v,s) do {\
   asm volatile (TIGRESS_IDENT("##_ANNOTATION_ATOMICREGION_") TIGRESS_STR(v)); \
   s \
} while (0)

#define TIGRESS_ENTROPY_UNINIT asm volatile ("##_ANNOTATION_ENTROPY-UNINIT");
#define TIGRESS_ENTROPY_VARIABLE(v) asm volatile (TIGRESS_IDENT("##_ANNOTATION_ENTROPY-VARIABLE_")TIGRESS_STR(v));

/*******************************************************************************/
/* TIGRESS DUAL-MAP FIX (issue 96): Darwin/arm64 Mach VM interface.            */
/*                                                                             */
/* jitter-Darwin-Arm-64-fixed.c maps the jitted code region twice (an RX exec  */
/* alias and an RW write alias) so JitDynamic can decode/re-encode blocks in   */
/* place while they stay executable. It cannot #include the <mach/...> headers (Tigress'   */
/* CIL frontend cannot parse the modern SDK headers), so the Mach entry points */
/* are hand-declared here. This header is prepended to the myjit source during  */
/* .ml generation AND included by every transformed program, so the prototypes  */
/* are available both when Tigress emits the code and when the user compiles it. */
/* Types are primitives matching the real Mach typedef widths on arm64, so the  */
/* declarations stay redeclaration-compatible with the <mach/...> headers. Guarded to       */
/* Darwin/arm64 so no other platform sees them.                                 */
/*******************************************************************************/
#if defined(__APPLE__) && defined(__aarch64__)
extern unsigned int mach_task_self_;
extern int mach_make_memory_entry_64(unsigned int, unsigned long long *, unsigned long long,
                                     int, unsigned int *, unsigned int)
                                     __asm__("_mach_make_memory_entry_64");
extern int mach_vm_map(unsigned int, unsigned long long *, unsigned long long, unsigned long long,
                       int, unsigned int, unsigned long long, int, int, int, unsigned int)
                       __asm__("_mach_vm_map");
extern int mach_vm_deallocate(unsigned int, unsigned long long, unsigned long long)
                             __asm__("_mach_vm_deallocate");
extern int mach_port_deallocate(unsigned int, unsigned int)
                               __asm__("_mach_port_deallocate");
#define TIG_HAVE_RW_DELTA 1   /* guards the jit_code_rw_delta root in src_roots.c */
#define TIG_MAP_MEM_NAMED_CREATE 0x020000
#define TIG_VM_PROT_RX           0x05  /* VM_PROT_READ | VM_PROT_EXECUTE */
#define TIG_VM_PROT_RW           0x03  /* VM_PROT_READ | VM_PROT_WRITE   */
#define TIG_VM_PROT_RWX          0x07  /* VM_PROT_READ | VM_PROT_WRITE | VM_PROT_EXECUTE */
#define TIG_VM_FLAGS_ANYWHERE    0x0001
#define TIG_VM_INHERIT_NONE      2
#endif
