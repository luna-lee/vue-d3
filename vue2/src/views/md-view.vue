<template>
    <v-md-preview :text="text"></v-md-preview>
</template>
<script>
import MoonHierarchyMd from '@/components/moon-hierarchy/readme.md';
export default {
    inheritAttrs: false,
    name: '',
    props: {},
    components: {},
    created() {},
    mounted() {},
    data() {
        return {
            text: MoonHierarchyMd
        };
    },
    watch: {},
    computed: {},
    methods: {}
};
</script>
<style lang="scss" scoped></style>
